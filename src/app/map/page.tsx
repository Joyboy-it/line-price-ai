'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Phone, MessageCircle } from 'lucide-react';

type Region = 'all' | 'central' | 'northeast' | 'north' | 'south';

const branches = [
  {
    id: 1,
    name: 'ส.เจริญชัย โรงกระดาษ',
    subtitle: 'สุขสวัสดิ์ 78 แยก 24',
    description: 'รับซื้อกระดาษ หนังสือพิมพ์ กล่องกระดาษ และเศษกระดาษทุกประเภท',
    mobile: ['088 789 3955', '099 156 4565'],
    line: '088 789 3955',
    mapUrl: 'https://maps.app.goo.gl/QUxCiMymoSymgs4Y8',
    embedUrl: 'https://www.google.com/maps?q=ส.เจริญชัย+โรงกระดาษ+สุขสวัสดิ์+78+แยก+24&output=embed&z=16',
    region: 'central' as Region,
  },
  {
    id: 2,
    name: 'วงษ์พาณิชย์พระประแดง',
    subtitle: 'สุขสวัสดิ์ 78 แยก 20',
    description: 'ตัวแทน รับซื้อ แบตเตอรี่เก่า ตะกั่ว ราคาโรงหลอม\nรับซื้อเหล็ก กระดาษ ทองแดง ทองเหลือง อลูมิเนี่ยม สแตนเลส\nเศษขวดแก้ว ขวดน้ำดื่ม PET อุปกรณ์อิเล็กทรอนิคส์\n-- ศูนย์บริการทำลายเอกสารสำคัญ ความลับ --',
    mobile: ['088 789 3955', '099 156 4565'],
    line: '088 789 3955',
    mapUrl: 'https://maps.app.goo.gl/dU2eMJqc2yjceXEE6',
    embedUrl: 'https://www.google.com/maps?q=ส.เจริญชัย+โกดัง+3+สุขสวัสดิ์+78+แยก+20&output=embed&z=16',
    region: 'central' as Region,
  },
  {
    id: 3,
    name: 'SB Steel Corporation',
    subtitle: 'สาขาพระประแดง',
    description: 'รับซื้อเหล็ก แบตเตอรี่เก่า ตะกั่ว ในและนอกสถานที่\nรับทุบ รื้อถอน อาคาร โครงสร้าง',
    mobile: ['081 755 3689'],
    line: '0827820321',
    mapUrl: 'https://goo.gl/maps/BexQihW5aaBNzmMj7',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3878.0700871109435!2d100.54753607589432!3d13.57599808679632!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e2a7e4f6f5f261%3A0xe6d5ed32e330bf7b!2sSB%20STEEL%20CORPORATION%20CO.%2CLTD!5e0!3m2!1sth!2sth!4v1709280000000!5m2!1sth!2sth',
    region: 'central' as Region,
  },
  {
    id: 4,
    name: 'วงษ์พาณิชย์โคราชสีดา',
    subtitle: 'สาขานครราชสีมา',
    description: 'ตัวแทน รับซื้อ แบตเตอรี่เก่า ตะกั่ว ราคาโรงหลอม\nรับซื้อเหล็ก กระดาษ ทองแดง ทองเหลือง อลูมิเนี่ยม สแตนเลส\nเศษขวดแก้ว ขวดน้ำดื่ม PET อุปกรณ์อิเล็กทรอนิคส์\n-- ศูนย์บริการทำลายเอกสารสำคัญ ความลับ --',
    mobile: ['094 365 3955'],
    line: 'somwongkhum',
    mapUrl: 'https://maps.app.goo.gl/Cs5j1baeXHGboyD4A',
    embedUrl: 'https://www.google.com/maps?q=วงษ์พาณิชย์โคราชสีดา+นครราชสีมา&output=embed&z=16',
    region: 'northeast' as Region,
  },
  {
    id: 5,
    name: 'วงษ์พาณิชย์สุราษฎร์กาญจนดิษฐ์',
    subtitle: 'สาขากาญจนดิษฐ์',
    description: 'ตัวแทน รับซื้อ แบตเตอรี่เก่า ตะกั่ว ราคาโรงหลอม\nรับซื้อเหล็ก กระดาษ ทองแดง ทองเหลือง อลูมิเนี่ยม สแตนเลส\nเศษขวดแก้ว ขวดน้ำดื่ม PET อุปกรณ์อิเล็กทรอนิคส์\n-- ศูนย์บริการทำลายเอกสารสำคัญ ความลับ --',
    mobile: ['081 694 7892'],
    line: '0816947892',
    mapUrl: 'https://maps.app.goo.gl/SU37rEp46QmzsnDU9',
    embedUrl: 'https://www.google.com/maps?q=วงษ์พาณิชย์+สุราษฎร์ธานี+กาญจนดิษฐ์&output=embed&z=16',
    region: 'south' as Region,
  },
];

const regionLabels = {
  all: 'ทั้งหมด',
  central: 'ภาคกลาง',
  northeast: 'ภาคตะวันออก',
  north: 'ภาคเหนือ',
  south: 'ภาคใต้',
};

export default function MapPage() {
  const [selectedRegion, setSelectedRegion] = useState<Region>('all');

  const filteredBranches = selectedRegion === 'all' 
    ? branches 
    : branches.filter(branch => branch.region === selectedRegion);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">กลับหน้าแรก</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">สาขารับซื้อของเก่า</h1>
            <p className="text-sm text-gray-500">{filteredBranches.length} สาขา{selectedRegion !== 'all' ? ` · ${regionLabels[selectedRegion]}` : 'ทั่วประเทศ'}</p>
          </div>
        </div>

        {/* Region Filter Buttons */}
        <div className="mt-5 flex flex-wrap gap-2">
          {(Object.keys(regionLabels) as Region[]).map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 min-w-0 ${
                selectedRegion === region
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {regionLabels[region]}
            </button>
          ))}
        </div>
      </div>

      {/* Branch Cards */}
      <div className="space-y-6">
        {filteredBranches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Branch Name Header - Above Map */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-4 text-center border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{branch.name}</h2>
              <div className="flex items-center justify-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <p className="text-sm text-gray-600">{branch.subtitle}</p>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="relative w-full h-80 bg-gray-100">
              <iframe
                src={branch.embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>

            {/* Card Body */}
            <div className="p-4">
              <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line">
                {branch.description}
              </p>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {/* Mobile Numbers */}
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    {branch.mobile.map((number, idx) => (
                      <a
                        key={idx}
                        href={`tel:${number.replace(/\s/g, '')}`}
                        className="block text-sm text-gray-700 hover:text-green-600 font-medium transition-colors"
                      >
                        {number}
                      </a>
                    ))}
                  </div>
                </div>

                {/* LINE ID */}
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <a
                    href={`https://line.me/ti/p/~${branch.line}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-700 hover:text-green-600 font-medium transition-colors"
                  >
                    LINE: {branch.line}
                  </a>
                </div>
              </div>

              {/* Navigate Button */}
              <a
                href={branch.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                <span>นำทางด้วย Google Maps</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6 pb-4">
        กดปุ่มนำทางเพื่อเปิด Google Maps
      </p>
    </div>
  );
}
