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

    // 이 기기에서 내가 등록한 메뉴 키 목록 불러오기
    let myMenuKeys = JSON.parse(localStorage.getItem('myWawaMenuKeys')) || [];
    let allMenusData = {};

    if (menuRef) {
        onValue(menuRef, (snapshot) => {
            const data = snapshot.val();
            allMenusData = data || {};
            renderMyMenus(allMenusData);
        }, (error) => {
            console.error("데이터 읽기 실패:", error);
        });
    } else {
        menuList.innerHTML = '<li class="empty-item" style="color:red;">Firebase 연동 오류 발생</li>';
    }

    // 메뉴 등록 버튼 클릭 이벤트
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

        // 파이어베이스에 메뉴 등록
        const newMenuRef = push(menuRef, { category, name, price });
        
        // 내 기기 저장소에 키 저장
        myMenuKeys.push(newMenuRef.key);
        localStorage.setItem('myWawaMenuKeys', JSON.stringify(myMenuKeys));

        // 입력창 초기화
        categorySelect.selectedIndex = 0;
        menuNameInput.value = '';
        menuPriceInput.value = '';
        categorySelect.focus();
    });

    // 주인 화면: 내가 등록한 메뉴만 필터링해서 보여주기
    function renderMyMenus(data) {
        menuList.innerHTML = '';
        
        const validKeys = myMenuKeys.filter(key => data[key]);

        if (validKeys.length === 0) {
            menuList.innerHTML = '<li class="empty-item">아직 등록한 메뉴가 없습니다.</li>';
            menuCount.textContent = '0개';
            return;
        }

        validKeys.forEach((key) => {
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

        menuCount.textContent = `${validKeys.length}개`;
    }

    // 메뉴 삭제 버튼
    menuList.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-menu-btn')) return;
        const key = e.target.dataset.key;
        
        if (menuRef) {
            remove(ref(db, `menus/${key}`));

            myMenuKeys = myMenuKeys.filter(k => k !== key);
            localStorage.setItem('myWawaMenuKeys', JSON.stringify(myMenuKeys));
            
            renderMyMenus(allMenusData);
        }
    });

    // 처음으로 버튼
    backBtn.addEventListener('click', () => {
        location.href = 'index.html'; 
    });
});
