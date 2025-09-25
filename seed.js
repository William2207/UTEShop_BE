import mongoose from "mongoose";
import Product from "./src/models/product.js";
import Category from "./src/models/category.js";
import Brand from "./src/models/brand.js";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Kết nối MongoDB thành công!");

        // Xóa dữ liệu cũ
        await Product.deleteMany();
        await Category.deleteMany();
        await Brand.deleteMany();
        console.log("🗑️ Đã xoá dữ liệu cũ!");

        // Tạo categories
        const categories = await Category.insertMany([
            { name: "Áo", description: "Các loại áo thun, sơ mi, hoodie" },
            { name: "Quần", description: "Quần jeans, quần short, quần tây" },
            { name: "Giày", description: "Sneaker, sandal, giày da" },
            { name: "Phụ kiện", description: "Túi xách, balo, thắt lưng" },
        ]);

        const [ao, quan, giay, phukien] = categories;

        // Tạo brands
        const brands = await Brand.insertMany([
            {
                name: "Nike",
                description: "Just Do It - Thương hiệu thể thao hàng đầu thế giới",
                logo: "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1758644567/nike_ugwwyj.jpg",
                website: "https://nike.com",
                country: "USA"
            },
            {
                name: "Adidas",
                description: "Impossible is Nothing - Ba sọc kinh điển",
                logo: "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1758644566/adias_w6vvfu.png",
                website: "https://adidas.com",
                country: "Germany"
            },

            {
                name: "Zara",
                description: "Fast fashion từ Tây Ban Nha",
                logo: "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1758644566/zara_jv1myp.png",
                website: "https://zara.com",
                country: "Spain"
            },
            {
                name: "H&M",
                description: "Fashion for everyone từ Thụy Điển",
                logo: "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1758644567/hm_ygxvj8.png",
                website: "https://hm.com",
                country: "Sweden"
            },
            {
                name: "Louis Vuitton",
                description: "Thương hiệu xa xỉ từ Pháp",
                logo: "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1758644567/lv_gwcmsx.png",
                website: "https://louisvuitton.com",
                country: "France"
            },
        ]);

        const [nike, adidas, zara, hm, lv] = brands;

        // Seed sản phẩm
        const products = [
            {
                name: "Áo thun thể thao tay ngắn bó sát Dri-FIT dành cho nam",
                description: "Bộ sưu tập Nike Pro mang đến cho bạn sự tự tin để vượt qua các mục tiêu cá nhân. Chiếc áo ôm sát này mang đến cảm giác mềm mại và co giãn, phù hợp với các môn thể thao và bài tập yêu thích của bạn. Hơn nữa, nó còn có viền bo tròn để che phủ tốt hơn hoặc tạo cảm giác chắc chắn khi bạn nhét áo vào quần.",
                price: 659000,
                stock: 100,
                images: [
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756521445/nike1_2_bqrbzs.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756521445/nike1_0_agdwvh.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756521445/nike1_1_gfmie2.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756521445/nike1_3_uzr0pb.avif"
                ],
                category: ao._id,
                brand: nike._id,
                soldCount: 50,
                viewCount: 200,
                discountPercentage: 10,
            },

            {
                name: "Áo khúc côn cầu nam của trường đại học",
                description: "Phong cách thể thao năng động mà bạn có thể diện xuống phố. Với các mảng lưới và điểm nhấn lấp lánh, chiếc áo len oversize này lấy cảm hứng từ những chiếc áo đấu khúc côn cầu cổ điển, mang đến cho bạn vẻ ngoài táo bạo, đậm chất thể thao.",
                price: 2039000,
                stock: 70,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522279/nike2_0_xqjjjc.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522280/nike2_1_yrzsln.avif",

                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522280/nike2_2_xhqkhl.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522280/nike2_3_k964mt.avif"
                ],

                category: ao._id,
                brand: nike._id,
                soldCount: 20,
                viewCount: 180,
                discountPercentage: 5,
            },
            {
                name: "Áo polo Dri-FIT nam",
                description: "Chất vải ImpossiblySoft mềm mại và mịn màng đến bất ngờ, mang đến cảm giác thoải mái cho mọi hoạt động. Chiếc áo polo dệt kim đôi cao cấp này được thiết kế với đường may tinh tế và công nghệ Dri-FIT thấm hút mồ hôi, mang đến sự thoải mái tối ưu khi di chuyển.",
                price: 2189000,
                stock: 80,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522280/nike3_0_bnqo82.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522280/nike3_1_gigtzd.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522280/nike3_2_lst5fq.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522280/nike3_3_qd36tp.avif"
                ],
                category: ao._id,
                brand: nike._id,
                soldCount: 70,
                viewCount: 300,
                discountPercentage: 20,
            },
            {
                name: "Áo Polo tay ngắn nam",
                description: "Từ sân golf đến câu lạc bộ, chiếc áo polo cổ điển này từ bộ sưu tập Nike Club mang đến một món đồ chủ lực đặc trưng cho tủ đồ của bạn. Chất vải cotton piqué bền bỉ và thoáng khí, đồng thời tạo điểm nhấn tinh tế cho mọi trang phục. Hơn nữa, áo được thiết kế để tạo cảm giác thoải mái cho phần ngực và cơ thể, mang đến phong cách thể thao năng động mà bạn có thể phối nhiều lớp. Kết hợp với quần chinos và giày thể thao Nike yêu thích của bạn để có một vẻ ngoài chỉn chu, lịch lãm mà bạn có thể diện ở bất cứ đâu.",
                price: 1279000,
                stock: 60,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522281/nike4_0_l7wzhr.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522281/nike4_1_w2tqw8.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522281/nike4_2_epfnqb.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522286/nike4_3_iofzad.avif"
                ],
                category: ao._id,
                brand: nike._id,
                soldCount: 30,
                viewCount: 120,
                discountPercentage: 15,
            },
            {
                name: "Jordan Flight Men's Utility Trousers",
                description: "Chiếc quần Ripstop nhẹ nhàng và rộng rãi này mang đậm phong cách tiện dụng và truyền thống Jordan. Túi hình thoi kết hợp với túi hộp tiêu chuẩn tạo nên vẻ ngoài độc đáo. Dây rút ở mắt cá chân cho phép bạn điều chỉnh độ dài của quần.",
                price: 2299000,
                stock: 60,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522286/nike5_0_ewamyw.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522287/nike5_1_qfhzeo.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522287/nike5_2_qhhwms.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522287/nike5_3_zsb2px.avif"
                ],
                category: quan._id,
                brand: nike._id,
                soldCount: 100,
                viewCount: 500,
                discountPercentage: 15,
            },
            {
                name: "JNike Air Men's Woven Track Trousers",
                description: "Quần thể thao cao cấp này được may từ chất liệu vải chống thấm nước, mềm mại và lớp lót lưới thoáng khí. Kiểu dáng ống quần thẳng, rộng rãi giúp bạn thoải mái vận động suốt cả ngày.",
                price: 2599000,
                stock: 60,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522288/nike6_0_zbzppf.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522289/nike6_1_ze4dlk.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522292/nike6_2_dluumb.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522291/nike6_3_ug0yxd.avif"
                ],
                category: quan._id,
                brand: nike._id,
                soldCount: 100,
                viewCount: 500,
                discountPercentage: 15,
            },
            {
                name: "Jordan Sport Men's Dri-FIT Mesh Diamond Shorts",
                description: "Lưới nhẹ và công nghệ thấm mồ hôi của chúng tôi giúp bạn luôn sảng khoái khi trận đấu nóng lên. Và lớp băng kim cương đặc trưng? Đó chính là điểm nhấn hoàn hảo.",
                price: 1119000,
                stock: 60,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522292/nike7_0_sefwab.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522292/nike7_1_elipak.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522293/nike7_2_tvqpls.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522293/nike7_3_jucpxx.avif"
                ],
                category: quan._id,
                brand: nike._id,
                soldCount: 100,
                viewCount: 500,
                discountPercentage: 15,
            },
            {
                name: "Nike SB Kearny Cargo Skate Trousers",
                description: "Chiếc quần nhẹ, thấm mồ hôi này được thiết kế để vận động thoải mái. Với 6 túi, bạn sẽ có nhiều chỗ để cất giữ những vật dụng cần thiết một cách an toàn trên và ngoài ván trượt. Dây buộc ở gấu quần cho phép bạn thắt chặt quần ở mắt cá chân hoặc để hở để cảm nhận sự thoải mái.",
                price: 2039000,
                stock: 60,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522294/nike8_0_yipv26.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522298/nike8_1_etm7wk.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522298/nike8_2_x990ay.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756522298/nike8_3_zz9hx0.avif"
                ],
                category: quan._id,
                brand: nike._id,
                soldCount: 100,
                viewCount: 500,
                discountPercentage: 15,
            },
            {
                name: "Áo Thun Arsenal Terrace Icons",
                description: "Hãy sống lại một trong những thời kỳ đáng nhớ nhất của môn thể thao vua cùng chiếc áo thun adidas Arsenal này. Lấy cảm hứng từ phong cách khán đài thập niên 80, thiết kế này nổi bật với huy hiệu khẩu thần công ở ngực và logo câu lạc bộ cổ điển ở sau cổ áo. Chất vải cotton mềm mại mang đến cảm giác thoải mái dù bạn đang cổ vũ cho Pháo Thủ hay đơn giản chỉ muốn thể hiện tình yêu bóng đá.",
                price: 1200000,
                stock: 40,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756523661/adias1_0_vjojgx.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756523661/adias1_1_kamafx.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756523662/adias1_3_eblkkf.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756523662/adias1_2_avulhk.avif"
                ],
                category: ao._id,
                brand: adidas._id,
                soldCount: 25,
                viewCount: 280,
                discountPercentage: 12,
            },
            {
                name: "Áo Thun Real Madrid Terrace Icons",
                description: "Thể hiện niềm đam mê với Real Madrid qua phong cách cổ điển đặc trưng của adidas. Chiếc áo thun bóng đá này là một thiết kế cổ điển, hoàn hảo để bạn thể hiện niềm đam mê của mình trong ngày thi đấu và cả những dịp thường ngày. Logo Ba Lá được thêu trên nền vải single jersey mềm mại mang lại vẻ ngoài cổ điển đặc trưng của những năm 1980.",
                price: 1200000,
                stock: 40,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756523666/adias2_0_tczvjf.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756523666/adias2_1_tcr9dz.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756523668/adias2_2_kpxelu.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756523669/adias2_3_ut1hbg.avif"
                ],
                category: ao._id,
                brand: adidas._id,
                soldCount: 25,
                viewCount: 280,
                discountPercentage: 12,
            },
            {
                name: "ÁO THUN SMILEY DAISY",
                description: "Áo thun Smiley Daisy từ adidas Originals mang đến thiết kế vui tươi và kiểu dáng thoải mái, sẵn sàng làm bừng sáng ngày mới của bạn. Chiếc áo thun in đồ hoạ này lan tỏa năng lượng tích cực với hình ảnh hoa cúc tươi vui, mang đến điểm nhấn ngộ nghĩnh cho tủ đồ của bạn. Được làm từ 100% chất liệu Better Cotton, áo mang đến cảm giác mềm mại và thoáng khí – lý tưởng cho trang phục hằng ngày.",
                price: 950000,
                stock: 40,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526408/adias3_2_pfw3bb.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526377/adias3_0_kgq6vk.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526407/adias3_1_slgf7h.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526409/adias3_3_mbeyz7.avif"
                ],
                category: ao._id,
                brand: adidas._id,
                soldCount: 25,
                viewCount: 280,
                discountPercentage: 12,
            },
            {
                name: "ÁO THUN BUBBLE CHERRY T",
                description: "Chiếc áo Bubble Cherry T là lựa chọn lý tưởng cho phong cách thoải mái nhưng vẫn thời thượng. Chiếc áo thun in họa tiết graphic này được thiết kế với phom rộng, mang lại cảm giác thoải mái và phong cách đầy tự nhiên. Chất liệu vải thun single jersey mềm mại khi tiếp xúc với da, lý tưởng cho việc mặc suốt cả ngày.",
                price: 950000,
                stock: 40,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526412/adias4_0_mqzfq8.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526415/adias4_3_wlqv92.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526412/adias4_1_l9bkqh.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526414/adias4_2_m2ezrx.avif"
                ],

                category: ao._id,
                brand: adidas._id,
                soldCount: 25,
                viewCount: 280,
                discountPercentage: 12,
            },
            {
                name: "Quần Short Sân Nhà Liverpool FC Mùa Giải 25/26",
                description: "Chào mừng trở về nhà, Những Chiến Binh Áo Đỏ. Liverpool FC và adidas – bộ đôi hoàn hảo qua mọi thời đại. Mở màn cho lần tái hợp thứ ba, chiếc quần short sân nhà này thuộc bộ sưu tập gợi nhớ phong cách từ những năm tháng trước. Liver Bird – biểu tượng của niềm tin và hy vọng trong bóng đá – sải cánh vững chãi ngay trên gấu quần. Công nghệ AEROREADY kiểm soát độ ẩm giúp người hâm mộ luôn khô ráo qua mọi khoảnh khắc ăn mừng cuồng nhiệt.",
                price: 15000000,
                stock: 40,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526418/adias5_0_xt793f.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526420/adias5_1_rczmfx.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526422/adias5_3_f4ploa.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526421/adias5_2_ktpt1f.avif"
                ],
                category: quan._id,
                brand: adidas._id,
                soldCount: 25,
                viewCount: 280,
                discountPercentage: 12,
            },
            {
                name: "Quần Short Graphic In Số",
                description: "Thư giãn thoải mái trong chiếc quần short adidas này. Với kiểu dáng rộng rãi, thoải mái, chiếc quần này mang đến cảm giác thư thái, tự do. Chất vải tricot mềm mại mang lại cảm giác thoải mái, dù bạn đang thư giãn trên ghế sofa hay ra ngoài cùng bạn bè. Họa tiết graphic số cỡ lớn ở ống quần tạo điểm nhấn thể thao cho diện mạo của bạn.",
                price: 4199000,
                stock: 40,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526424/adias6_0_vh3ub3.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526425/adias6_1_cqn9om.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526427/adias6_2_tnaxpp.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526429/adias6_3_byhhbf.avif"
                ],
                category: quan._id,
                brand: adidas._id,
                soldCount: 25,
                viewCount: 280,
                discountPercentage: 12,
            },
            {
                name: "Quần Short Nỉ adidas Marvel Spider-man",
                description: "Spider-Man thân thiện của khu phố xuất hiện đầy ấn tượng khi giăng tơ qua logo 3-Thanh biểu tượng — điểm nhấn thú vị trên chiếc quần short adidas này. Chất vải pha cotton mang lại cảm giác thoải mái, dù bạn đang chiến đấu với những kẻ phản diện hay chỉ đơn giản là thư giãn trong thời gian rảnh. Dây rút ở cạp quần cho phép bạn dễ dàng điều chỉnh độ vừa vặn.",
                price: 1200000,
                stock: 40,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526429/adias7_0_mo3sth.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526431/adias7_1_gnjqti.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526434/adias7_3_dpjkkf.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526433/adias7_2_bnejjy.avif"
                ],
                category: quan._id,
                brand: adidas._id,
                soldCount: 25,
                viewCount: 280,
                discountPercentage: 12,
            },
            {
                name: "Quần Short adidas Crazy Lite — In Họa Tiết Toàn Bộ",
                description: "Khi bạn gắn bó với sân bóng rổ mỗi ngày, bạn cần một chiếc quần short chuyên dụng để luôn thoải mái trong từng pha di chuyển. Chiếc quần short bóng rổ siêu nhẹ này của adidas nổi bật với họa tiết in khắp quần, mang đến vẻ ngoài độc đáo. Thiết kế rộng rãi giúp bạn tự do bứt tốc từ đầu sân đến cuối sân mà không bị cản trở. Công nghệ CLIMACOOL thoát ẩm và đánh bay mồ hôi mang lại cảm giác mát mẻ, khô ráo và không chút phân tâm.",
                price: 1200000,
                stock: 40,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526435/adias8_0_o1kame.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526437/adias8_1_wziqsf.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526438/adias8_2_hoqcpo.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756526439/adias8_3_gdh7y5.avif"
                ],
                category: quan._id,
                brand: adidas._id,
                soldCount: 25,
                viewCount: 280,
                discountPercentage: 12,
            },
            //zarara ao
            {
                name: "ÁO SƠ MI DENIM DÁNG BOXY FIT",
                description: "Áo sơ mi dáng boxy fit, chất liệu denim cotton. Cổ ve lật và tay dài bo gấu cài khuy. Túi ngực chi tiết viền. Hiệu ứng bạc màu. Cài khuy phía trước.",
                price: 1399000,
                stock: 25,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542180/zara1_0_hm2d3d.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542181/zara1_1_uf2bzn.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542181/zara1_2_pt2laa.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542180/zara1_3_ha0w02.jpg"
                ],
                category: ao._id,
                brand: zara._id,
                soldCount: 15,
                viewCount: 90,
                discountPercentage: 8,
            },
            {
                name: "ÁO SƠ MI VẢI RŨ KIỂU DÁNG",
                description: "Áo sơ mi dáng suông, may từ vải rũ pha viscose. Cổ ve lật, tay ngắn. Gấu xẻ hai bên. Cài khuy phía trước.",
                price: 1399000,
                stock: 25,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542181/zara2_0_dulvij.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542182/zara2_1_d8lyhm.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542182/zara2_2_rw9gt8.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542182/zara2_3_i06jxv.jpg"
                ],
                category: ao._id,
                brand: zara._id,
                soldCount: 15,
                viewCount: 90,
                discountPercentage: 8,
            },
            {
                name: "ÁO SƠ MI 100% VẢI LINEN",
                description: "Áo sơ mi dáng suông, may từ vải linen pha viscose. Cổ ve lật, tay ngắn. Gấu xẻ hai bên. Cài khuy phía trước.",
                price: 1699000,
                stock: 25,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542182/zara3_0_xqwr0f.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542182/zara3_1_ooj4lu.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542180/zara3_2_kcqnjw.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542180/zara3_3_jsfbvi.jpg"
                ],
                category: ao._id,
                brand: zara._id,
                soldCount: 15,
                viewCount: 90,
                discountPercentage: 8,
            },
            {
                name: "ÁO SƠ MI HỌA TIẾT CÁ CHÉP",
                description: "Áo sơ mi vải rũ pha sợi viscose, dáng relaxed fit. Cổ ve nhọn khoét chữ K, cộc tay. Có một túi đáp trước ngực. Gấu xẻ hai bên. Cài phía trước bằng hàng khuy cài.",
                price: 1399000,
                stock: 25,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542181/zara4_0_jnebgr.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542182/zara4_1_momqbg.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542182/zara4_2_edxxel.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542183/zara4_3_xpk4zl.jpg"
                ],
                category: ao._id,
                brand: zara._id,
                soldCount: 15,
                viewCount: 90,
                discountPercentage: 8,
            },//
            //zara quan
            {
                name: "QUẦN VẢI DỆT THIẾT KẾ THOẢI MÁ",
                description: "Quần dáng slim fit, chất liệu vải co giãn hai chiều. Có hai túi phía trước và hai túi may viền cài khuy phía sau. Cài phía trước bằng khóa kéo và khuy.",
                price: 1399000,
                stock: 25,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542182/zara5_0_f120io.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542183/zara5_1_rxpipg.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542183/zara5_2_jorndb.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542183/zara5_3_dbnmyw.jpg"
                ],
                category: quan._id,
                brand: zara._id,
                soldCount: 15,
                viewCount: 90,
                discountPercentage: 8,
            },
            {
                name: "QUẦN DÁNG WIDE FIT XẾP LI",
                description: "Quần vải pha sợi viscose, dáng wide fit. Cạp có chi tiết xếp li. Có túi hai bên và hai túi may viền phía sau. Cài phía trước bằng khóa kéo và khuy.",
                price: 1899000,
                stock: 25,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542183/zara6_0_myokgt.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542184/zara6_1_xuyfvu.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542184/zara6_2_zzne6x.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542184/zara6_3_gayyhs.jpg"
                ],
                category: quan._id,
                brand: zara._id,
                soldCount: 15,
                viewCount: 90,
                discountPercentage: 8,
            },
            {
                name: "QUẦN CHINO DÁNG SKINNY FIT",
                description: "Áo sơ mi dáng boxy fit, chất liệu denim cotton. Cổ ve lật và tay dài bo gấu cài khuy. Túi ngực chi tiết viền. Hiệu ứng bạc màu. Cài khuy phía trước.",
                price: 1199000,
                stock: 35,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542184/zara7_0_mlpiwj.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542184/zara7_1_qgm9kh.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542195/zara7_2_lbhyrv.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542195/zara7_3_d5yak4.jpg"
                ],
                category: quan._id,
                brand: zara._id,
                soldCount: 25,
                viewCount: 50,
                discountPercentage: 18,
            },
            {
                name: "QUẦN DÁNG SLIM FIT THIẾT KẾ THOẢI MÁI",
                description: "Quần bằng vải siêu co giãn. Cạp co giãn. Có hai túi phía trước và hai túi may viền phía sau. Cài phía trước bằng khóa kéo và khuy.",
                price: 1399000,
                stock: 25,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542195/zara8_0_zqhg4g.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542195/zara8_1_lkfgcf.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542195/zara8_2_s0tpyc.jpg",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756542196/zara8_3_uidjgu.jpg"
                ],
                category: quan._id,
                brand: zara._id,
                soldCount: 5,
                viewCount: 10,
                discountPercentage: 12,
            },
            // ao lv
            {
                name: "Áo Sơ Mi Da",
                description: "Thuộc bộ sưu tập Thu-Đông 2025 do Giám đốc sáng tạo Pharrell hợp tác với nhà thiết kế Nigo, mẫu áo sơ mi da toát lên vẻ đẹp tinh tế, khẳng định kỹ nghệ chế tác bậc thầy của Maison. Chất liệu da bê mềm mại màu be với bề mặt tựa vải Linen, điểm xuyết họa tiết Monogram được in tinh tế. Các nhãn thương hiệu bằng da màu hồng và xanh lá bắt mắt như logo LV Japan trên ngực áo và chữ Vuitton cách điệu ở mặt sau hoàn thiện tổng thể trẻ trung, năng động.",
                price: 122000000,
                stock: 15,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543806/lv1_0_ahpsrw.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543806/lv1_1_bfuckm.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543806/lv1_2_a60pcr.avif"
                ],
                category: ao._id,
                brand: lv._id,
                soldCount: 5,
                viewCount: 120,
                discountPercentage: 20,
            },
            {
                name: "Áo Sơ Mi Họa Tiết Damier",
                description: "Được may từ vải lụa Twill óng ánh, mẫu áo sơ mi ngắn tay gây ấn tượng với nền vải phủ họa tiết Damier, lồng ghép dòng chữ Marque L.Vuitton Déposée đặc trưng. Với gam màu xanh dương thanh lịch, thiết kế dễ dàng kết hợp với các mẫu trang phục màu trơn hoặc quần ngắn đồng điệu để tạo nên tổng thể thời thượng.",
                price: 52500000,
                stock: 20,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543806/lv2_0_x3m1nl.webp",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543807/lv2_1_fo9byd.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543807/lv2_2_ifytbu.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543807/lv2_3_i0v0d3.avif"
                ],
                category: ao._id,
                brand: lv._id,
                soldCount: 10,
                viewCount: 50,
                discountPercentage: 10,
            },
            {
                name: "Áo Hoodie",
                description: "Là mảnh ghép bắt mắt cho trang phục thường nhật, mẫu áo Hoodie đậm chất hè được may từ vải Jersey mỏng nhẹ dệt từ sợi Cotton hữu cơ. Nổi bật trên nền vải màu trắng sữa là mô típ hoa lồng ghép chữ Vuitton màu xanh dương đậm, một dấu ấn đặc trưng của bộ sưu tập Thu-Đông 2025. Dây rút mũ trùm cũng có màu xanh dương đồng điệu, kết hợp với đầu dây bằng kim loại màu vàng sẫm.",
                price: 37500000,
                stock: 10,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543807/lv3_0_bgsxu0.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543807/lv3_1_swwsa6.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543814/lv3_2_vzhu9c.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543814/lv3_3_hhojuf.avif"
                ],
                category: ao._id,
                brand: lv._id,
                soldCount: 5,
                viewCount: 10,
                discountPercentage: 30,
            },
            {
                name: "Áo Polo",
                description: "Lấy cảm hứng từ phong cách đường phố đầu những năm 2000, mẫu áo Polo là một mảnh ghép thuộc bộ sưu tập Thu-Đông 2025 do Giám đốc sáng tạo Pharrell Williams hợp tác sản xuất với nhà thiết kế Nigo. Ngoài chất liệu mỏng nhẹ và thoáng mát, áo còn được tô điểm mô típ biểu tượng của nhà mốt Pháp trên nền vải dệt kim màu nâu sẫm, phù hợp để mặc thường nhật.",
                price: 47000000,
                stock: 40,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543814/lv4_0_i0sdyl.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543815/lv4_1_bgp2p3.avif"
                ],
                category: ao._id,
                brand: lv._id,
                soldCount: 15,
                viewCount: 50,
                discountPercentage: 15,
            },
            //quan lv
            {
                name: "Quần Jean",
                description: "Quần Jean cao cấp, chất liệu denim cotton. Có hai túi phía trước và hai túi may viền phía sau. Cài phía trước bằng khóa kéo và khuy.",
                price: 185000000,
                stock: 10,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543818/lv5_0_iysoox.webp",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543819/lv5_1_lcty45.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543819/lv5_2_xmqyxx.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543819/lv5_3_osbulu.avif"
                ],
                category: quan._id,
                brand: lv._id,
                soldCount: 5,
                viewCount: 150,
                discountPercentage: 30,
            },
            {
                name: "Quần Ống Loe",
                description: "Mẫu quần ống loe màu đen được may từ hỗn hợp len-Mohair cao cấp, kết hợp năm túi và đinh tán ánh ngọc trai thời thượng. Điểm nhấn thương hiệu được thể hiện tinh tế qua miếng da Nubuck trên túi phụ với dòng chữ Marque L.Vuitton Déposée và chi tiết Jacqueron ở phía sau dập nổi mô típ Mini Damier.",
                price: 37500000,
                stock: 100,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543822/lv6_0_oyire1.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543823/lv6_1_j2nmnm.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543823/lv6_2_qwcjw7.avif"
                ],
                category: quan._id,
                brand: lv._id,
                soldCount: 15,
                viewCount: 110,
                discountPercentage: 10,
            },
            {
                name: "Quần Dài Họa Tiết Damoflage - Made To Order",
                description: "Thuộc bộ sưu tập Thu-Đông 2025, mẫu quần dài ghi dấu ấn với họa tiết Damoflage Sakura màu hồng được dệt kiểu Jacquard, gợi nhớ đến biểu tượng hoa anh đào chủ đạo của BST. Thiết kế sở hữu phom dáng rộng rãi theo phong cách Workwear, kết hợp với chi tiếp đắp trước gối, túi quần và miếng da Jacqueron dập nổi mô típ Mini Damier. Quần có thể kết hợp với áo khoác đồng điệu để tạo nên bộ âu phục đẹp mắt. Đây là sản phẩm được sản xuất theo đơn đặt hàng.",
                price: 91000000,
                stock: 10,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543824/lv7_0_pcpds7.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543826/lv7_1_rve0y6.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543827/lv7_2_pf0pkz.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543827/lv7_3_gxeqqt.avif"
                ],
                category: quan._id,
                brand: lv._id,
                soldCount: 5,
                viewCount: 150,
                discountPercentage: 30,
            },
            {
                name: "Quần Ngắn Họa Tiết Damier",
                description: "Mẫu quần ngắn năng động được may từ chất liệu Cotton Piqué màu be điểm xuyết mô típ Damier, kết hợp với các chi tiết bằng vải Nylon nổi bật ở phía ngoài hai ống quần và trên túi quần. Thắt lưng có dây rút bo sọc gân và đầu dây bằng kim loại màu vàng, trong khi nhãn thêu LV Japan tạo điểm nhấn trên túi quần bên trái, gợi liên tưởng đến bộ sưu tập hợp tác với nhà thiết kế Nigo người Nhật. Sản phẩm sẽ phối hợp hài hòa với áo dệt kim đồng điệu để tạo nên tổng thể thoải mái.",
                price: 37500000,
                stock: 10,
                images: ["https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543828/lv8_1_ivjj45.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543827/lv8_0_p1a5og.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543829/lv8_2_xc3gff.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756543831/lv8_3_mvvzrp.avif"
                ],
                category: quan._id,
                brand: lv._id,
                soldCount: 25,
                viewCount: 150,
                discountPercentage: 10,
            },

            // ao hm
            {
                name: "Áo sơ mi linen pha Regular Fit",
                description: "Áo sơ mi bằng cotton mỏng nhẹ và linen dệt thoi có cổ bẻ, nẹp khuy kiểu truyền thống, cầu vai phía sau và một túi ngực mở. Tay dài với măng sét cài khuy điều chỉnh và nẹp tay áo có khuy nối. Vạt tròn. Dáng vừa để mặc thoải mái và tạo dáng cổ điển. Cotton pha linen kết hợp sự mềm mại của cotton với độ bền của linen, tạo ra một loại vải đẹp, có vân nổi, thoáng khí và rủ mềm hoàn hảo. ",
                price: 799000,
                stock: 17,
                images: [
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545518/hm1_2_ijbzia.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545517/hm1_1_muzunz.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545518/hm1_3_oo87gk.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545517/hm1_0_eaxjlt.avif"

                ],
                category: ao._id,
                brand: hm._id,
                soldCount: 35,
                viewCount: 100,
                discountPercentage: 12,
            },
            {
                name: "Áo sơ mi jersey cổ hai ve Regular Fit",
                description: "Áo sơ mi ngắn tay bằng vải jersey vân nổi làm từ cotton pha có cổ hai ve, nẹp khuy liền và vạt ngang. Dáng vừa để mặc thoải mái và tạo dáng cổ điển. ",
                price: 499000,
                stock: 100,
                images: [
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545520/hm2_2_rty8yd.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545522/hm2_3_ubnmzd.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545520/hm2_1_iznfit.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545519/hm2_0_easc4m.avif"
                ],
                category: ao._id,
                brand: hm._id,
                soldCount: 200,
                viewCount: 150,
                discountPercentage: 15,
            },
            {
                name: "Áo sơ mi linen pha Regular Fit",
                description: "Áo sơ mi bằng cotton và linen mỏng nhẹ dệt thoi có cổ bẻ, nẹp khuy kiểu truyền thống, cầu vai phía sau và một túi ngực mở. Tay dài với măng sét cài khuy điều chỉnh và nẹp tay áo có khuy nối. Vạt tròn. Dáng vừa để mặc thoải mái và tạo dáng cổ điển. Cotton pha linen kết hợp sự mềm mại của cotton với độ bền của linen, tạo ra một loại vải đẹp, có vân nổi, thoáng khí và rủ mềm hoàn hảo. ",
                price: 799000,
                stock: 120,
                images: [
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545524/hm3_0_obyhht.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545526/hm3_3_ohsohw.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545524/hm3_1_omtv9m.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545525/hm3_2_pgkis8.avif"
                ],
                category: ao._id,
                brand: hm._id,
                soldCount: 215,
                viewCount: 150,
                discountPercentage: 18,
            },
            {
                name: "Áo sơ mi cổ hai ve dệt ô vuông Loose Fit",
                description: "Áo sơ mi ngắn tay bằng jersey dệt ô vuông mềm có cổ hai ve, nẹp khuy liền, cầu vai phía sau, vai ráp trễ và vạt ngang có đường xẻ hai bên. Dáng rộng để mặc thoải mái nhưng không bị thụng. ",
                price: 3799000,
                stock: 120,
                images: [
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545527/hm4_0_xisg2e.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545529/hm4_1_qptmzj.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545531/hm4_3_hv70ri.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545530/hm4_2_tt802o.avif"
                ],
                category: ao._id,
                brand: hm._id,
                soldCount: 25,
                viewCount: 50,
                discountPercentage: 12,
            },
            // quan hm
            {
                name: "Loose Cargo Jeans",
                description: "Quần jean túi hộp bằng cotton denim cứng với ống bo tròn và dáng rộng từ vòng ba cho tới gấu với toàn bộ ống quần rộng rãi. Cạp thường với nẹp khoá kéo và khuy. Túi hai bên, túi sau và túi ống quần có nắp. Đây là tất cả những gì bạn cần để diện một bộ denim hoàn hảo. ",
                price: 999000,
                stock: 75,
                images: [
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545532/hm5_0_dyun6b.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545533/hm5_1_mlwwag.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545533/hm5_2_birppu.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545538/hm5_3_wgnyft.avif"
                ],
                category: quan._id,
                brand: hm._id,
                soldCount: 25,
                viewCount: 130,
                discountPercentage: 12,
            },
            {
                name: "Baggy Jeans",
                description: "Quần jean 5 túi bằng cotton denim cứng. Ống lượn tròn và dáng baggy từ vòng ba cho tới gấu với toàn bộ ống quần rộng rãi. Đũng hạ thấp và trùng ở mắt cá. Cạp thường và nẹp khoá kéo. Đây là món đồ denim hoàn hảo. ",
                price: 999000,
                stock: 80,
                images: [
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545538/hm6_0_dbegch.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545540/hm6_1_eknmzu.avif",

                ],
                category: quan._id,
                brand: hm._id,
                soldCount: 20,
                viewCount: 110,
                discountPercentage: 18,
            },
            {
                name: "Quần dài dệt chéo Loose Fit",
                description: "Quần dài dệt chéo mềm có ly xếp bên trên. Cạp co giãn, nẹp khoá kéo và khuy, túi chéo hai bên và túi sau giả. Dáng rộng để mặc thoải mái nhưng không bị thụng. ",
                price: 799000,
                stock: 75,
                images: [
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545540/hm7_0_f896d6.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545542/hm7_1_yttwqj.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545545/hm7_2_xvw8lq.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545546/hm7_3_nf5wp2.avif"
                ],
                category: quan._id,
                brand: hm._id,
                soldCount: 25,
                viewCount: 150,
                discountPercentage: 10,
            },
            {
                name: "Quần dài túi hộp Loose Fit",
                description: "Quần dài túi hộp bằng cotton dệt thoi có cạp chun bọc có dây rút, nẹp kéo khoá giả, túi chéo hai bên, túi sau có nắp cài khuy bấm và túi ống quần cài khuy bấm. Ly xếp may liền ở đầu gối và dây rút ẩn ở gấu. Dáng rộng để mặc thoải mái nhưng không bị thụng. ",
                price: 899000,
                stock: 180,
                images: [
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545546/hm8_0_gkexgb.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545549/hm8_1_zmytnr.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545551/hm8_2_hpa6oe.avif",
                    "https://res.cloudinary.com/dx8ffnhq3/image/upload/v1756545553/hm8_3_kshgpc.avif"
                ],
                category: quan._id,
                brand: hm._id,
                soldCount: 20,
                viewCount: 10,
                discountPercentage: 30,
            },



        ];

        await Product.insertMany(products);
        console.log("✅ Seed dữ liệu sản phẩm và thương hiệu thành công!");
        console.log(`📦 Đã tạo ${products.length} sản phẩm từ ${brands.length} thương hiệu`);

        process.exit();
    } catch (err) {
        console.error("❌ Lỗi seed dữ liệu:", err);
        process.exit(1);
    }
}

seed();
