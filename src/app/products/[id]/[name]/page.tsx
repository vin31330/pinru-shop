import ProductPage, { generateMetadata as generateProductMetadata } from "@/app/products/[id]/page";

export const revalidate = 60;

export const generateMetadata = generateProductMetadata;

export default ProductPage;
