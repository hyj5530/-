// DOM 요소 가져오기
const ownerBtn = document.getElementById('ownerBtn');
const customerBtn = document.getElementById('customerBtn');

// 가게 주인 버튼 클릭 이벤트
ownerBtn.addEventListener('click', function() {
    alert('가게 주인 화면으로 이동합니다!');
    (location.href = '주인1.html');
});

// 손님 버튼 클릭 이벤트
customerBtn.addEventListener('click', function() {
    alert('손님 화면으로 이동합니다!');
    (location.href = '손님1.html');
});
