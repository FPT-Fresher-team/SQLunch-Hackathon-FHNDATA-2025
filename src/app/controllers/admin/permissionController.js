const attributePermission = {
  CREATE: ['admin', 'manager'],
  READ  : ['admin', 'manager'],
  UPDATE: ['admin'],
  DELETE: ['admin']
}
const brandPermission = {
  CREATE: ['admin', 'manager'],
  READ  : ['admin', 'manager'],
  UPDATE: ['admin', 'manager'],
  DELETE: ['admin', 'manager']
}
const blogPermission = {
  CREATE: ['admin', 'manager'],
  READ  : ['admin', 'manager'],
  UPDATE: ['admin', 'manager'],
  DELETE: ['admin', 'manager']
}
const chatPermission = {
  CREATE: ['chat', 'admin'], 
  READ  : ['chat', 'admin'],
  UPDATE: ['chat', 'admin'],
  DELETE: ['chat', 'admin']
}
const customerPermission = {
  CREATE: ['admin', 'manager', 'employee'],
  READ  : ['admin', 'manager', 'employee', 'chat'],
  UPDATE: ['admin', 'manager', 'employee'],
  DELETE: ['admin', 'manager']
}
const employeePermission = {
  CREATE: ['admin', 'manager'],
  READ  : ['admin', 'manager'],
  UPDATE: ['admin'],
  DELETE: ['admin']
}
const homePermission = {
  CREATE: ['admin'],
  READ  : ['admin', 'manager'],
  UPDATE: ['admin'],
  DELETE: ['admin']
}
const orderPermission = {
  CREATE: ['admin', 'manager', 'employee', 'merchandise', 'shipper'],
  READ  : ['admin', 'manager', 'employee', 'merchandise', 'shipper'],
  UPDATE: ['admin', 'manager', 'employee', 'merchandise', 'shipper'],
  DELETE: ['admin', 'manager', 'merchandise']
}
const productPermission = {
  CREATE: ['admin', 'manager', 'employee'],
  READ  : ['admin', 'manager', 'employee'],
  UPDATE: ['admin', 'manager', 'employee'],
  DELETE: ['admin', 'manager']
}
const purchasePermission = {
  CREATE: ['admin', 'manager', 'merchandise'],
  READ  : ['admin', 'manager', 'merchandise'],
  UPDATE: ['admin', 'manager', 'merchandise'],
  DELETE: ['admin', 'manager', 'merchandise']
}
const storePermission = {
  CREATE: ['admin', 'manager'],
  READ  : ['admin', 'manager'],
  UPDATE: ['admin', 'manager'],
  DELETE: ['admin', 'manager']
}
const supplierPermission = {
  CREATE: ['admin', 'manager'],
  READ  : ['admin', 'manager', 'merchandise'],
  UPDATE: ['admin', 'manager', 'merchandise'],
  DELETE: ['admin', 'manager']
}
const voucherPermission = {
  CREATE: ['admin', 'manager', 'employee'],
  READ  : ['admin', 'manager', 'employee'],
  UPDATE: ['admin', 'manager', 'employee'],
  DELETE: ['admin', 'manager']
}

module.exports = { 
  attributePermission ,
  brandPermission     ,
  blogPermission      ,
  chatPermission      ,
  customerPermission  ,
  employeePermission  ,
  homePermission      ,
  orderPermission     ,
  productPermission   ,
  purchasePermission  ,
  storePermission     ,
  supplierPermission  ,
  voucherPermission   ,
}