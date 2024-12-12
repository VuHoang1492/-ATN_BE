const devision = require('./province.json')

const getProvince = (id) => {
    const found = devision.province.find(p => p.idProvince === id)
    if (!found) {
        throw new Error('Tỉnh/thành phố không hợp lệ!')
    }

    return found.name
}



const getDistrict = (id) => {
    const found = devision.district.find(d => d.idDistrict === id)
    if (!found) {
        throw new Error('Quận/huyện không hợp lệ!')
    }
    return found.name
}

const getCommune = (id) => {
    const found = devision.commune.find(c => c.idCommune === id)
    if (!found) {
        throw new Error('Xã/phường không hợp lệ!')
    }
    return found.name
}


module.exports = { getProvince, getDistrict, getCommune }