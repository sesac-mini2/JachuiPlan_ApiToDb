// Description: API 데이터를 가공하여 DB에 알맞은 데이터로 변환하는 함수들을 정의한 파일

function officeHotel(row) {
    // deposit, monthlyRent에 쉼표(,)가 들어가 있어서 제거해줘야 함
    // dealYear, dealMonth, dealDay를 합쳐서 makeDealDate로 만들어주기
    row.deposit = ("" + row.deposit).replace(/,/g, '');
    row.monthlyRent = ("" + row.monthlyRent).replace(/,/g, '');
    row.makeDealDate = new Date(`${row.dealYear}-${("0" + row.dealMonth).slice(-2)}-${("0" + row.dealDay).slice(-2)}`);
}

function dandok(row) {
    // deposit, monthlyRent에 쉼표(,)가 들어가 있어서 제거해줘야 함
    // dealYear, dealMonth, dealDay를 합쳐서 makeDealDate로 만들어주기
    row.buildingType = '1'; // 단독/다가구 타입 = 1
    row.deposit = ("" + row.deposit).replace(/,/g, '');
    row.monthlyRent = ("" + row.monthlyRent).replace(/,/g, '');
    row.makeDealDate = new Date(`${row.dealYear}-${("0" + row.dealMonth).slice(-2)}-${("0" + row.dealDay).slice(-2)}`);
}

function yeonlip(row) {
    // deposit, monthlyRent에 쉼표(,)가 들어가 있어서 제거해줘야 함
    // dealYear, dealMonth, dealDay를 합쳐서 makeDealDate로 만들어주기
    row.buildingType = '2'; // 연립다세대 타입 = 2
    row.deposit = ("" + row.deposit).replace(/,/g, '');
    row.monthlyRent = ("" + row.monthlyRent).replace(/,/g, '');
    row.makeDealDate = new Date(`${row.dealYear}-${("0" + row.dealMonth).slice(-2)}-${("0" + row.dealDay).slice(-2)}`);
}

export default { officeHotel, dandok, yeonlip };
