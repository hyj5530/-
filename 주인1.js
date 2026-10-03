// DOM 요소 가져오기
const submitBtn = document.getElementById('submitBtn');
const categorySelect = document.getElementById('category');
const menuNameInput = document.getElementById('menuName');
const menuPriceInput = document.getElementById('menuPrice');
const menuList = document.getElementById('menuList');
const menuCount = document.getElementById('menuCount');
const backBtn = document.getElementById('backBtn');

// 페이지가 로드될 때 localStorage에 저장된 메뉴 불러오기
let menus = JSON.parse(localStorage.getItem('wawaMenus')) || [];

// 화면에 기존 메뉴 렌더링
renderMenus();

// '메뉴 등록하기' 버튼 클릭 이벤트
submitBtn.addEventListener('click', function() {
    const category = categorySelect.value;
    const name = menuNameInput.value.trim();
    const priceRaw = menuPriceInput.value;

    // 유효성 검사 (입력 안 한 항목이 있는지 확인)
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

    const price = Number(priceRaw).toLocaleString(); // 가격 콤마 포맷 (예: 12,000)

    // 새 메뉴 객체 생성
    const newMenu = { category, name, price };
    
    // 배열에 추가
    menus.push(newMenu);

    // 브라우저 저장소에 저장 (새로고침해도 안 사라지게 유지)
    localStorage.setItem('wawaMenus', JSON.stringify(menus));

    // 화면 갱신
    renderMenus();

    // 입력창 초기화
    categorySelect.selectedIndex = 0;
    menuNameInput.value = '';
    menuPriceInput.value = '';
    categorySelect.focus();
});

// 메뉴 목록 화면에 그려주는 함수
function renderMenus() {
    menuList.innerHTML = '';

    if (menus.length === 0) {
        menuList.innerHTML = '<li class="empty-item">아직 등록된 메뉴가 없습니다.</li>';
        menuCount.textContent = '0개';
        return;
    }

    menus.forEach((menu, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><b>[${menu.category}]</b> ${menu.name}</span>
            <span style="color: #845ec2; font-weight: bold;">${menu.price}원</span>
        `;
        menuList.appendChild(li);
    });

    // 개수 업데이트
    menuCount.textContent = `${menus.length}개`;
}

// '처음으로' 버튼 클릭 시 환영 페이지로 이동
backBtn.addEventListener('click', function() {
    location.href = 'index.html'; 
});