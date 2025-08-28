import mongoose from "mongoose";
import Product from "./src/models/product.js";
import Category from "./src/models/category.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/shop";

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Kết nối MongoDB thành công!");

        // Xóa dữ liệu cũ
        await Product.deleteMany();
        await Category.deleteMany();
        console.log("🗑️ Đã xoá dữ liệu cũ!");

        // Tạo categories
        const categories = await Category.insertMany([
            { name: "Áo", description: "Các loại áo thun, sơ mi, hoodie" },
            { name: "Quần", description: "Quần jeans, quần short, quần tây" },
            { name: "Giày", description: "Sneaker, sandal, giày da" },
            { name: "Phụ kiện", description: "Túi xách, balo, thắt lưng" },
        ]);

        const [ao, quan, giay, phukien] = categories;

        // Seed sản phẩm
        const products = [
            {
                name: "Áo thun nam basic",
                description: "Áo thun cotton thoáng mát",
                price: 199000,
                stock: 100,
                images: ["https://picsum.photos/400/400?random=1"],
                category: ao._id,
                soldCount: 50,
                viewCount: 200,
                discountPercentage: 10,
            },
            {
                name: "Áo sơ mi trắng",
                description: "Sơ mi trắng form slimfit",
                price: 299000,
                stock: 70,
                images: ["https://picsum.photos/400/400?random=2"],
                category: ao._id,
                soldCount: 20,
                viewCount: 180,
                discountPercentage: 5,
            },
            {
                name: "Quần jeans rách gối",
                description: "Jeans nữ phong cách cá tính",
                price: 399000,
                stock: 80,
                images: ["https://picsum.photos/400/400?random=3"],
                category: quan._id,
                soldCount: 70,
                viewCount: 300,
                discountPercentage: 20,
            },
            {
                name: "Quần short kaki",
                description: "Quần short nam mặc hè",
                price: 249000,
                stock: 60,
                images: ["https://picsum.photos/400/400?random=4"],
                category: quan._id,
                soldCount: 30,
                viewCount: 120,
                discountPercentage: 15,
            },
            {
                name: "Giày sneaker unisex",
                description: "Sneaker nam nữ năng động",
                price: 599000,
                stock: 60,
                images: ["https://picsum.photos/400/400?random=5"],
                category: giay._id,
                soldCount: 100,
                viewCount: 500,
                discountPercentage: 15,
            },
            {
                name: "Giày sandal nữ",
                description: "Sandal nữ dễ thương đi chơi",
                price: 359000,
                stock: 40,
                images: ["https://picsum.photos/400/400?random=6"],
                category: giay._id,
                soldCount: 15,
                viewCount: 80,
                discountPercentage: 25,
            },
            {
                name: "Túi xách da nữ",
                description: "Túi xách thời trang cho nữ",
                price: 499000,
                stock: 40,
                images: ["https://picsum.photos/400/400?random=7"],
                category: phukien._id,
                soldCount: 20,
                viewCount: 150,
                discountPercentage: 30,
            },
            {
                name: "Balo laptop",
                description: "Balo chống sốc cho laptop 15 inch",
                price: 699000,
                stock: 25,
                images: ["https://picsum.photos/400/400?random=8"],
                category: phukien._id,
                soldCount: 10,
                viewCount: 90,
                discountPercentage: 12,
            },
        ];

        await Product.insertMany(products);
        console.log("✅ Seed dữ liệu sản phẩm thời trang thành công!");

        process.exit();
    } catch (err) {
        console.error("❌ Lỗi seed dữ liệu:", err);
        process.exit(1);
    }
}

seed();
