import Image from 'next/image';

interface ProductCardProps {
  item: any;
  onAdd: (item: any) => void;
  onViewDetail: (id: number) => void;
}

function isCustomizable(item: any): boolean {
  return Boolean(
    item?.ingredients?.some((ing: any) => Boolean(ing?.pivot?.is_adjustable))
  );
}

export function ProductCard({ item, onAdd, onViewDetail }: ProductCardProps) {
  const customizable = isCustomizable(item);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewDetail(item.id)}
      onKeyDown={(e) => e.key === 'Enter' && onViewDetail(item.id)}
      className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col hover:border-orange-500/30 transition-all group overflow-hidden animate-fade-in-up cursor-pointer"
    >
      {item.image_url && (
        <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 bg-gray-50">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {customizable && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 shadow-sm border border-orange-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h.008v.008H3.75V6zm0 6h.008v.008H3.75V12zm0 6h.008v.008H3.75V18z" />
              </svg>
              Customize
            </span>
          )}
        </div>
      )}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="font-display font-bold text-gray-900 text-lg leading-tight group-hover:text-orange-500 transition-colors">
            {item.name}
          </h3>
          <div className="flex flex-col gap-1 items-end">
            {item._is_recommendation === true && (
              <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-sm border border-purple-200">
                AI Pick ✨
              </span>
            )}
            {item._is_recommendation === false && (
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-sm border border-red-200">
                Popular 🔥
              </span>
            )}
            {item.is_signature && (
              <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                Signature
              </span>
            )}
            {customizable && !item.image_url && (
              <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 border border-orange-100">
                Customize
              </span>
            )}
          </div>
        </div>
        <p className="text-sm font-sans text-gray-500 line-clamp-2 mb-4 leading-relaxed">
          {item.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="font-sans font-bold text-gray-900 text-base">
            Rs {parseFloat(item.base_price).toLocaleString('en-PK')}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (customizable) {
                onViewDetail(item.id);
              } else {
                onAdd(item);
              }
            }}
            className="h-10 w-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all active:scale-95 border border-orange-100 hover:shadow-lg hover:shadow-orange-500/25"
            aria-label={
              customizable
                ? `Customize ${item.name}`
                : `Add ${item.name} to order`
            }
          >
            {customizable ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h.008v.008H3.75V6zm0 6h.008v.008H3.75V12zm0 6h.008v.008H3.75V18z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
