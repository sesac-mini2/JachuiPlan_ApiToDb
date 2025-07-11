// Description: API 데이터를 가공하여 DB에 알맞은 데이터로 변환하는 함수들을 정의한 파일

function officeHotel(row) {
    return {
        ...row,
        // deposit, monthlyRent에 쉼표(,)가 들어가 있어서 제거해줘야 함
        deposit: ("" + row.deposit).replace(/,/g, ''),
        monthlyRent: ("" + row.monthlyRent).replace(/,/g, ''),
        // dealYear, dealMonth, dealDay를 합쳐서 makeDealDate로 만들어주기
        makeDealDate: new Date(
            `${row.dealYear}-${("0" + row.dealMonth).slice(-2)}-${("0" + row.dealDay).slice(-2)}`
        )
    };
}

function yeonlip(row) {
    return {
        ...row,
        // deposit, monthlyRent에 쉼표(,)가 들어가 있어서 제거해줘야 함
        deposit: ("" + row.deposit).replace(/,/g, ''),
        monthlyRent: ("" + row.monthlyRent).replace(/,/g, ''),
        // dealYear, dealMonth, dealDay를 합쳐서 makeDealDate로 만들어주기
        makeDealDate: new Date(
            `${row.dealYear}-${("0" + row.dealMonth).slice(-2)}-${("0" + row.dealDay).slice(-2)}`
        ),
        buildingType: '2' // 연립다세대 타입 = 2
    };
}

function dandok(row) {
    return {
        ...row,
        deposit: ("" + row.deposit).replace(/,/g, ''),
        monthlyRent: ("" + row.monthlyRent).replace(/,/g, ''),
        makeDealDate: new Date(
            `${row.dealYear}-${("0" + row.dealMonth).slice(-2)}-${("0" + row.dealDay).slice(-2)}`
        ),
        buildingType: '1' // 단독/다가구 타입 = 1
    };
}

export default { officeHotel, dandok, yeonlip };
