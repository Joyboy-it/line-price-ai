import type { PoolClient } from 'pg';
import { query, queryOne, transaction } from '@/lib/db';
import type { ParsedOfferRow } from './import-rows';
import type { OfferCandidate } from './select-offer';
import type { FactoryOrderFileRecord, FactoryOrderRecord, OrderStatus } from './types';
import type { CustomerOrderInput } from './validation';

const iso = (column: string) => `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

const ORDER_SELECT = `
  SELECT o.id, o.user_id, u.name AS customer_name,
    to_char(o.delivery_date, 'YYYY-MM-DD') AS delivery_date,
    o.factory_id, f.name AS factory_name,
    o.product_id, p.name AS product_name,
    o.license_plate, o.customer_note,
    o.offer_id, o.agent_id, a.name AS agent_name, o.price::text AS price,
    o.po_number, o.delivery_note_number,
    o.form_file_path, o.form_file_name, o.form_mime_type,
    to_char(o.confirmed_date, 'YYYY-MM-DD') AS confirmed_date,
    to_char(o.delivery_time, 'HH24:MI') AS delivery_time,
    o.confirmed_factory_id, cf.name AS confirmed_factory_name,
    o.confirmed_product_id, cp.name AS confirmed_product_name,
    o.staff_note, o.status,
    ${iso('o.cancelled_at')} AS cancelled_at,
    ${iso('o.created_at')} AS created_at,
    ${iso('o.updated_at')} AS updated_at
  FROM factory_orders o
  JOIN users u ON u.id = o.user_id
  JOIN factories f ON f.id = o.factory_id
  JOIN factory_products p ON p.id = o.product_id
  LEFT JOIN agents a ON a.id = o.agent_id
  LEFT JOIN factories cf ON cf.id = o.confirmed_factory_id
  LEFT JOIN factory_products cp ON cp.id = o.confirmed_product_id`;

// ---------- Orders ----------

export async function getOrder(orderId: string): Promise<FactoryOrderRecord | null> {
  return queryOne<FactoryOrderRecord>(`${ORDER_SELECT} WHERE o.id = $1`, [orderId]);
}

export async function getCustomerOrder(orderId: string, userId: string): Promise<FactoryOrderRecord | null> {
  return queryOne<FactoryOrderRecord>(`${ORDER_SELECT} WHERE o.id = $1 AND o.user_id = $2`, [orderId, userId]);
}

export async function listCustomerOrders(userId: string): Promise<FactoryOrderRecord[]> {
  return query<FactoryOrderRecord>(`${ORDER_SELECT} WHERE o.user_id = $1 ORDER BY o.created_at DESC LIMIT 200`, [userId]);
}

export async function getOrderFiles(orderId: string): Promise<FactoryOrderFileRecord[]> {
  return query<FactoryOrderFileRecord>(
    `SELECT id, kind, file_name, file_path, mime_type, file_size, ${iso('created_at')} AS created_at
     FROM factory_order_files WHERE order_id = $1 ORDER BY created_at`,
    [orderId]
  );
}

export interface StaffOrderFilters {
  status?: OrderStatus;
  from?: string;
  to?: string;
  factoryId?: string;
  q?: string;
  page: number;
}

export const STAFF_PAGE_SIZE = 20;

export async function listStaffOrders(filters: StaffOrderFilters): Promise<{ orders: FactoryOrderRecord[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    conditions.push(sql.replace('?', `$${params.length}`));
  };

  if (filters.status) add('o.status = ?', filters.status);
  if (filters.from) add('o.delivery_date >= ?::date', filters.from);
  if (filters.to) add('o.delivery_date <= ?::date', filters.to);
  if (filters.factoryId) add('o.factory_id = ?', filters.factoryId);
  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`(u.name ILIKE $${params.length} OR o.license_plate ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Math.max(filters.page, 1) - 1) * STAFF_PAGE_SIZE;

  const [orders, count] = await Promise.all([
    query<FactoryOrderRecord>(
      `${ORDER_SELECT} ${where} ORDER BY o.created_at DESC LIMIT ${STAFF_PAGE_SIZE} OFFSET ${offset}`,
      params
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM factory_orders o JOIN users u ON u.id = o.user_id ${where}`,
      params
    ),
  ]);

  return { orders, total: parseInt(count?.count || '0') };
}

const CUSTOMER_EDITABLE = `confirmed_date IS NULL AND status NOT IN ('cancelled', 'completed')`;

export async function insertCustomerOrder(
  userId: string,
  input: CustomerOrderInput,
  snapshot: ReturnType<typeof offerSnapshot>
): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO factory_orders (
       user_id, delivery_date, factory_id, product_id, license_plate, customer_note,
       offer_id, agent_id, price, po_number, delivery_note_number, form_file_path, form_file_name, form_mime_type
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id`,
    [
      userId, input.deliveryDate, input.factoryId, input.productId, input.licensePlate, input.customerNote,
      snapshot.offer_id, snapshot.agent_id, snapshot.price, snapshot.po_number, snapshot.delivery_note_number,
      snapshot.form_file_path, snapshot.form_file_name, snapshot.form_mime_type,
    ]
  );
  return row!.id;
}

/** Returns false when the order is no longer editable (e.g. staff confirmed it meanwhile). */
export async function updateCustomerOrder(
  orderId: string,
  userId: string,
  input: CustomerOrderInput,
  snapshot: ReturnType<typeof offerSnapshot> | null
): Promise<boolean> {
  const values: unknown[] = [input.deliveryDate, input.factoryId, input.productId, input.licensePlate, input.customerNote];
  let snapshotSql = '';
  if (snapshot) {
    const columns = Object.keys(snapshot) as (keyof typeof snapshot)[];
    snapshotSql = columns.map((column) => {
      values.push(snapshot[column]);
      return `, ${column} = $${values.length}`;
    }).join('');
  }
  values.push(orderId, userId);
  const row = await queryOne<{ id: string }>(
    `UPDATE factory_orders SET
       delivery_date = $1, factory_id = $2, product_id = $3, license_plate = $4, customer_note = $5${snapshotSql}
     WHERE id = $${values.length - 1} AND user_id = $${values.length} AND ${CUSTOMER_EDITABLE}
     RETURNING id`,
    values
  );
  return row !== null;
}

export async function cancelCustomerOrder(orderId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `UPDATE factory_orders SET status = 'cancelled', cancelled_at = NOW()
     WHERE id = $1 AND user_id = $2 AND ${CUSTOMER_EDITABLE}
     RETURNING id`,
    [orderId, userId]
  );
  return row !== null;
}

// ---------- Offers ----------

export interface OfferForSelection extends OfferCandidate {
  agentName: string;
  priceText: string;
  poNumber: string | null;
  deliveryNoteNumber: string | null;
  formFilePath: string | null;
  formFileName: string | null;
  formMimeType: string | null;
}

export async function getOffersForProduct(productId: string): Promise<OfferForSelection[]> {
  return query<OfferForSelection>(
    `SELECT ao.id AS "offerId", ao.agent_id AS "agentId", a.name AS "agentName",
       a.sort_order AS "agentSortOrder", ao.price::float8 AS price, ao.price::text AS "priceText",
       (ao.is_active AND a.is_active) AS "isActive",
       ao.po_number AS "poNumber", ao.delivery_note_number AS "deliveryNoteNumber",
       ao.form_file_path AS "formFilePath", ao.form_file_name AS "formFileName", ao.form_mime_type AS "formMimeType"
     FROM agent_offers ao
     JOIN agents a ON a.id = ao.agent_id
     WHERE ao.product_id = $1
     ORDER BY a.sort_order, a.name`,
    [productId]
  );
}

/** Columns copied from an offer into factory_orders at order time. */
export function offerSnapshot(offer: OfferForSelection | null) {
  return {
    offer_id: offer?.offerId ?? null,
    agent_id: offer?.agentId ?? null,
    price: offer?.priceText ?? null,
    po_number: offer?.poNumber ?? null,
    delivery_note_number: offer?.deliveryNoteNumber ?? null,
    form_file_path: offer?.formFilePath ?? null,
    form_file_name: offer?.formFileName ?? null,
    form_mime_type: offer?.formMimeType ?? null,
  };
}

// ---------- Customer options ----------

export interface FactoryOption {
  id: string;
  name: string;
  products: { id: string; name: string }[];
}

const AVAILABLE_PRODUCT = `
  p.is_active AND f.is_active AND EXISTS (
    SELECT 1 FROM agent_offers ao JOIN agents a ON a.id = ao.agent_id
    WHERE ao.product_id = p.id AND ao.is_active AND a.is_active
  )`;

/** Factories and products a customer can choose. No prices or agents. */
export async function listFactoryOptions(): Promise<FactoryOption[]> {
  return query<FactoryOption>(
    `SELECT f.id, f.name,
       json_agg(json_build_object('id', p.id, 'name', p.name) ORDER BY p.name) AS products
     FROM factories f
     JOIN factory_products p ON p.factory_id = f.id
     WHERE ${AVAILABLE_PRODUCT}
     GROUP BY f.id
     ORDER BY f.sort_order, f.name`
  );
}

/** Every factory with its products, for staff confirmation (includes closed ones, flagged). */
export async function listFactoryProductTree(): Promise<(FactoryOption & { is_active: boolean })[]> {
  return query<FactoryOption & { is_active: boolean }>(
    `SELECT f.id, f.name, f.is_active,
       COALESCE(json_agg(json_build_object('id', p.id, 'name', p.name) ORDER BY p.name)
         FILTER (WHERE p.id IS NOT NULL), '[]') AS products
     FROM factories f
     LEFT JOIN factory_products p ON p.factory_id = f.id
     GROUP BY f.id
     ORDER BY f.sort_order, f.name`
  );
}

export async function isProductAvailable(factoryId: string, productId: string): Promise<boolean> {
  const row = await queryOne<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM factory_products p JOIN factories f ON f.id = p.factory_id
       WHERE p.id = $1 AND f.id = $2 AND ${AVAILABLE_PRODUCT}
     ) AS ok`,
    [productId, factoryId]
  );
  return row?.ok === true;
}

// ---------- Settings ----------

export interface FactoryRow { id: string; name: string; is_active: boolean; sort_order: number }
export interface AgentRow { id: string; name: string; is_active: boolean; sort_order: number }
export interface OfferRow {
  id: string;
  factory_id: string;
  factory_name: string;
  product_id: string;
  product_name: string;
  agent_id: string;
  agent_name: string;
  agent_sort_order: number;
  price: string;
  po_number: string | null;
  delivery_note_number: string | null;
  form_file_name: string | null;
  is_active: boolean;
  updated_at: string;
}

export async function listFactories(): Promise<FactoryRow[]> {
  return query<FactoryRow>(`SELECT id, name, is_active, sort_order FROM factories ORDER BY sort_order, name`);
}

export async function listAgents(): Promise<AgentRow[]> {
  return query<AgentRow>(`SELECT id, name, is_active, sort_order FROM agents ORDER BY sort_order, name`);
}

export async function listOffers(factoryId?: string): Promise<OfferRow[]> {
  return query<OfferRow>(
    `SELECT ao.id, f.id AS factory_id, f.name AS factory_name, p.id AS product_id, p.name AS product_name,
       a.id AS agent_id, a.name AS agent_name, a.sort_order AS agent_sort_order,
       ao.price::text AS price, ao.po_number, ao.delivery_note_number, ao.form_file_name,
       ao.is_active, ${iso('ao.updated_at')} AS updated_at
     FROM agent_offers ao
     JOIN factory_products p ON p.id = ao.product_id
     JOIN factories f ON f.id = p.factory_id
     JOIN agents a ON a.id = ao.agent_id
     ${factoryId ? 'WHERE f.id = $1' : ''}
     ORDER BY f.sort_order, f.name, p.name, a.sort_order, a.name`,
    factoryId ? [factoryId] : []
  );
}

async function upsertFactory(client: PoolClient, name: string): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO factories (name, sort_order)
     VALUES ($1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM factories))
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name]
  );
  return result.rows[0].id;
}

async function upsertProduct(client: PoolClient, factoryId: string, name: string): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO factory_products (factory_id, name) VALUES ($1, $2)
     ON CONFLICT (factory_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [factoryId, name]
  );
  return result.rows[0].id;
}

async function upsertAgent(client: PoolClient, name: string): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO agents (name, sort_order)
     VALUES ($1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agents))
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name]
  );
  return result.rows[0].id;
}

/** Creates or updates one offer. Empty PO / delivery note (null) keeps the stored value. */
export async function upsertOffer(
  client: PoolClient,
  input: { factoryName: string; productName: string; agentName: string; price: number; poNumber: string | null; deliveryNoteNumber: string | null }
): Promise<{ id: string; inserted: boolean }> {
  const factoryId = await upsertFactory(client, input.factoryName);
  const productId = await upsertProduct(client, factoryId, input.productName);
  const agentId = await upsertAgent(client, input.agentName);
  const result = await client.query<{ id: string; inserted: boolean }>(
    `INSERT INTO agent_offers (product_id, agent_id, price, po_number, delivery_note_number)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, agent_id) DO UPDATE SET
       price = EXCLUDED.price,
       po_number = COALESCE(EXCLUDED.po_number, agent_offers.po_number),
       delivery_note_number = COALESCE(EXCLUDED.delivery_note_number, agent_offers.delivery_note_number)
     RETURNING id, (xmax = 0) AS inserted`,
    [productId, agentId, input.price, input.poNumber, input.deliveryNoteNumber]
  );
  return result.rows[0];
}

export async function importOffers(rows: ParsedOfferRow[]): Promise<{ created: number; updated: number }> {
  return transaction(async (client) => {
    let created = 0;
    let updated = 0;
    for (const row of rows) {
      const { inserted } = await upsertOffer(client, row);
      if (inserted) created++;
      else updated++;
    }
    return { created, updated };
  });
}
