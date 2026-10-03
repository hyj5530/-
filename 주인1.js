import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🌟 데이터베이스 주소가 포함된 최종 설정값
const firebaseConfig = {
    apiKey: "AIzaSyA6Cp4wtBdLj5qccadneCWfCSe2qfg1FDU",
    authDomain: "deliverywawa.firebaseapp.com",
    databaseURL: "https://deliverywawa-default-rtdb.firebaseio.com",
    projectId: "deliverywawa",
    storageBucket: "deliverywawa.firebasestorage.app",
    messagingSenderId: "137660899274",
    appId: "1:137660899274:web:957d0dc6e86715c3a6f933",
    measurementId: "G-1KRDR5LGD8"
};

let db, menuRef;
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    menuRef = ref(db, 'menus');
} catch (e) {
    console.error("Firebase 초기화 오류:", e);
}

document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submitBtn');
    const categorySelect = document.getElementById('category');
    const menuNameInput = document.getElementById('menuName');
    const menuPriceInput = document.getElementById('menuPrice');
    const menuList = document.getElementById('menuList');
    const menuCount = document.getElementById('menuCount');
    const backBtn = document.getElementById('backBtn');

    if (menuRef) {
        onValue(menuRef, (snapshot) => {
            const data = snapshot.val();
            renderMenus(data || {});
        }, (error) => {
            console.error("데이터 읽기 실패:", error);
        });
    } else {
        menuList.innerHTML = '<li class="empty-item" style="color:red;">Firebase 연동 오류 발생</li>';
    }

    submitBtn.addEventListener('click', () => {
        const category = categorySelect.value;
        const name = menuNameInput.value.trim();
        const priceRaw = menuPriceInput.value;

        if (!category || category === "카테고리를 선택해주세요") {
            alert('음식 카테고리를 선택해주세요!');
            categorySelect.focus();
            return;
        }
        if (!name) {
            alert('음식 이름을 입력해주세요!');
            menuNameInput.focus();
            return;
        }
        if (!priceRaw || priceRaw <= 0) {
            alert('올바른 가격을 입력해주세요!');
            menuPriceInput.focus();
            return;
        }

        const price = Number(priceRaw).toLocaleString();

        push(menuRef, { category, name, price }).then(() => {
            categorySelect.selectedIndex = 0;
            menuNameInput.value = '';
            menuPriceInput.value = '';
            categorySelect.focus();
        }).catch((error) => {
            alert('등록 실패: ' + error.message);
        });
    });

    function renderMenus(data) {
        menuList.innerHTML = '';
        const keys = Object.keys(data);

        if (keys.length === 0) {
            menuList.innerHTML = '<li class="empty-item">아직 등록된 메뉴가 없습니다.</li>';
            menuCount.textContent = '0개';
            return;
        }

        keys.forEach((key) => {
            const menu = data[key];
            const li = document.createElement('li');
            li.innerHTML = `
                <span><b>[${menu.category}]</b> ${menu.name}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #845ec2; font-weight: bold;">${menu.price}원</span>
                    <button class="delete-menu-btn" data-key="${key}" style="background:#ff6b6b; color:white; border:none; padding:3px 8px; border-radius:6px; cursor:pointer;">삭제</button>
                </div>
            `;
            menuList.appendChild(li);
        });

        menuCount.textContent = `${keys.length}개`;
    }

    menuList.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-menu-btn')) return;
        const key = e.target.dataset.key;
        if (menuRef) {
            remove(ref(db, `menus/${key}`));
        }
    });

    backBtn.addEventListener('click', () => {
        location.href = 'index.html'; 
    });
});
