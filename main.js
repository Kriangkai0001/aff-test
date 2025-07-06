// --- Supabase config ---
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('feed-container')) {
        loadPosts();
    }
    if (document.getElementById('post-form')) {
        handleFormSubmit();
    }
});

async function loadPosts() {
    const feedContainer = document.getElementById('feed-container');
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        feedContainer.innerHTML = '<h3>เกิดข้อผิดพลาดในการโหลดโพสต์</h3>';
        return;
    }
    if (data.length === 0) {
        feedContainer.innerHTML = '<h3>ยังไม่มีโพสต์ในขณะนี้</h3>';
        return;
    }
    feedContainer.innerHTML = '';
    data.forEach(post => {
        const postUrl = `${window.location.origin}/post.html?id=${post.id}`;
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.innerHTML = `
            <img src="${post.image_url}" alt="ภาพประกอบ: ${post.caption.substring(0, 30)}" width="300"><br>
            <h2>${post.caption}</h2>
            <p>โพสต์เมื่อ: ${new Date(post.created_at).toLocaleDateString('th-TH')}</p>
            <a href="${post.affiliate_link}" target="_blank" class="affiliate-button">สนใจสินค้า คลิกเลย</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}" target="_blank" class="share-btn">แชร์ไป Facebook</a>
        `;
        feedContainer.appendChild(postCard);
    });
}

// ฟังก์ชันอัพโหลดไฟล์รูปไป Supabase Storage
async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;
    // สร้าง bucket 'uploads' ใน Supabase Storage ก่อนใช้งาน
    let { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { upsert: false });
    if (uploadError) throw uploadError;

    // ดึง public URL ของไฟล์ที่อัพโหลด
    const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
    return urlData.publicUrl;
}

function handleFormSubmit() {
    const form = document.getElementById('post-form');
    const submitBtn = document.getElementById('submit-btn');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังโพสต์...';

        const imageFile = document.getElementById('image_file').files[0];
        const caption = document.getElementById('caption').value;
        const affiliateLink = document.getElementById('affiliate_link').value;

        if (!imageFile) {
            alert('กรุณาเลือกรูปภาพ');
            submitBtn.disabled = false;
            submitBtn.textContent = 'สร้างโพสต์';
            return;
        }

        try {
            // 1. อัพโหลดไฟล์รูป
            const imageUrl = await uploadImage(imageFile);

            // 2. บันทึกโพสต์ลงฐานข้อมูล
            const { error } = await supabase
                .from('posts')
                .insert([{ image_url: imageUrl, caption: caption, affiliate_link: affiliateLink }]);
            if (error) {
                alert('สร้างโพสต์ไม่สำเร็จ! กรุณาตรวจสอบ Console');
            } else {
                alert('สร้างโพสต์สำเร็จ!');
                form.reset();
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
            console.error(err);
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'สร้างโพสต์';
    });
}