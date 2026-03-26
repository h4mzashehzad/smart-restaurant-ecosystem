'use client';

interface CategorySliderProps {
  categories: any[];
  activeCategoryId: number | null;
  onSelectCategory: (id: number) => void;
}

export function CategorySlider({ categories, activeCategoryId, onSelectCategory }: CategorySliderProps) {
  return (
    <div className="overflow-x-auto no-scrollbar scroll-smooth flex gap-3 py-4 px-4 sticky top-0 bg-gray-50/90 backdrop-blur-md z-20">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
            activeCategoryId === cat.id
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)]'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
