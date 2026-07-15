import ProductImage from "@/components/ProductImage";

export default function CartItemImage({
  imageUrl,
  name,
}: {
  imageUrl?: string;
  name: string;
}) {
  return (
    <ProductImage
      src={imageUrl}
      alt={name}
      className="h-20 w-20 shrink-0 rounded-xl"
    />
  );
}
