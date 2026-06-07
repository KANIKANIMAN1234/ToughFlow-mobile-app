"use client";

type Props = {
  name: string;
};

/** 地図上に常時表示する顧客名ラベル＋ピン */
export function CustomerMapPin({ name }: Props) {
  return (
    <div className="flex -translate-x-1/2 -translate-y-full flex-col items-center">
      <div className="max-w-[9rem] truncate rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-900 shadow-md">
        {name}
      </div>
      <div className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-600 shadow" />
    </div>
  );
}
