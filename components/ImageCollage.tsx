import type { PostImageView } from "@/lib/posts";

/**
 * 피드 카드용 사진 배치.
 * 1장은 원본 비율(너무 길면 잘라서), 2장 이상은 익숙한 콜라주로 묶는다.
 * 4장이 넘으면 마지막 칸에 +N을 얹고 나머지는 상세에서 본다.
 */
export function ImageCollage({ images, alt }: { images: PostImageView[]; alt: string }) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    const [image] = images;
    const ratio = image.width && image.height ? `${image.width} / ${image.height}` : "4 / 3";
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={image.url}
        alt={alt}
        loading="lazy"
        style={{ aspectRatio: ratio }}
        // 여행 일정표처럼 세로로 긴 캡쳐는 카드에서 잘라 보여주고 상세에서 전체를 본다
        className="block max-h-[520px] w-full object-cover object-top"
      />
    );
  }

  const shown = images.slice(0, 4);
  const overflow = images.length - shown.length;

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {shown.map((image) => (
          <Tile key={image.id} image={image} alt={alt} className="aspect-square" />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-0.5">
        <Tile image={shown[0]} alt={alt} className="row-span-2 h-full" />
        <Tile image={shown[1]} alt={alt} className="h-full" />
        <Tile image={shown[2]} alt={alt} className="h-full" />
      </div>
    );
  }

  return (
    <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5">
      {shown.map((image, index) => (
        <div key={image.id} className="relative h-full">
          <Tile image={image} alt={alt} className="h-full" />
          {index === 3 && overflow > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
              +{overflow}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Tile({
  image,
  alt,
  className = "",
}: {
  image: PostImageView;
  alt: string;
  className?: string;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={image.url}
      alt={alt}
      loading="lazy"
      className={`block w-full object-cover object-top ${className}`}
    />
  );
}
