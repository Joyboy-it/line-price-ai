import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import BranchImage from './BranchImage';

const branches = [
  {
    id: 1,
    name: 'ส.เจริญชัย โรงกระดาษ',
    subtitle: 'สุขสวัสดิ์ 78 แยก 24',
    description: 'รับซื้อกระดาษ หนังสือพิมพ์ กล่องกระดาษ และเศษกระดาษทุกประเภท',
    mapUrl: 'https://maps.app.goo.gl/QUxCiMymoSymgs4Y8',
    image: '/map-images/branch1.png',
  },
  {
    id: 2,
    name: 'ส.เจริญชัย โกดัง 3',
    subtitle: 'สุขสวัสดิ์ 78 แยก 20',
    description: 'รับซื้อเศษเหล็ก อลูมิเนียม ทองแดง และโลหะทุกชนิด',
    mapUrl: 'https://maps.app.goo.gl/dU2eMJqc2yjceXEE6',
    image: '/map-images/branch2.png',
  },
  {
    id: 3,
    name: 'SB Steel Corporation',
    subtitle: 'สาขากรุงเทพฯ',
    description: 'รับซื้อและจำหน่ายเหล็กทุกประเภท เหล็กโครงสร้าง เหล็กแผ่น และเหล็กเส้น',
    mapUrl: 'https://maps.app.goo.gl/8DWrUcdDk2rzY2QW7',
    image: '/map-images/branch3.png',
  },
  {
    id: 4,
    name: 'ส.เจริญ โคราช',
    subtitle: 'สาขานครราชสีมา',
    description: 'รับซื้อของเก่าทุกประเภท เศษโลหะ กระดาษ พลาสติก และอุปกรณ์เก่า',
    mapUrl: 'https://maps.app.goo.gl/Cs5j1baeXHGboyD4A',
    image: '/map-images/branch4.png',
  },
  {
    id: 5,
    name: 'วงษ์พาณิชย์ สุราษฎร์ธานี',
    subtitle: 'สาขากาญจนดิษฐ์',
    description: 'รับซื้อของเก่าทุกประเภทในพื้นที่ภาคใต้ เศษโลหะ กระดาษ และพลาสติก',
    mapUrl: 'https://maps.app.goo.gl/SU37rEp46QmzsnDU9',
    image: '/map-images/branch5.png',
  },
];

export default async function MapPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

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
            <p className="text-sm text-gray-500">{branches.length} สาขาทั่วประเทศ</p>
          </div>
        </div>
      </div>

      {/* Branch Cards */}
      <div className="space-y-5">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Branch Image */}
            <div className="relative w-full h-44 bg-gray-100">
              <BranchImage src={branch.image} alt={branch.name} />
              {/* Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                  สาขา {branch.id}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4">
              <h2 className="text-base font-bold text-gray-900 mb-0.5">{branch.name}</h2>

              <div className="flex items-center gap-1.5 mb-3">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-500">{branch.subtitle}</p>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {branch.description}
              </p>

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
