export const permissions = {
  attributePermission : ['admin', 'manager'],
  brandPermission     : ['admin', 'manager'],
  chatPermission      : ['chat' , 'admin'],
  chatEmpPermission   : ['admin', 'manager', 'employee'],
  customerPermission  : ['admin', 'manager', 'employee'],
  employeePermission  : ['admin', 'manager'],
  homePermission      : ['admin', 'manager'],
  orderPermission     : ['admin', 'manager', 'employee', 'merchandise', 'shipper'], 
  productPermission   : ['admin', 'manager', 'employee'],
  materialPermission  : ['admin', 'manager', 'employee'],
  purchasePermission  : ['admin', 'manager', 'merchandise'],
  storePermission     : ['admin', 'manager'],
  supplierPermission  : ['admin', 'manager', 'merchandise'],
  voucherPermission   : ['admin', 'manager', 'employee'],
}

export const menuConfig = [
  { id:"all"                , href:"/admin/all"           , icon:"fi fi-rr-home"        , label:"Báo cáo"         , permission:"homePermission"       },
  { id:"all-customers"      , href:"/admin/all-customers" , icon:"fi fi-rr-users"       , label:"Khách hàng"      , permission:"customerPermission"   },
  { id:"all-vouchers"       , href:"/admin/all-vouchers"  , icon:"fi fi-rr-ticket"      , label:"Voucher"         , permission:"voucherPermission"    },
  { id:"all-u-vouchers"     , href:"/admin/all-u-vouchers", icon:"fi fi-rr-ticket"      , label:"Voucher Cá nhân" , permission:"voucherPermission"    },
  { id:"all-chats"          , href:"/admin/all-chats"     , icon:"fi fi-rr-comment"     , label:"Chat khách hàng" , permission:"chatPermission"       },
  // { id:"all-chats-emp", href:"/admin/all-chats-emp", icon:"fi fi-rr-comment",     label:"Chat nội bộ",     permission:"chatEmpPermission" },
  { id:"all-purchases"      , href:"/admin/all-purchases" , icon:"fi fi-rr-file-import" , label:"Nhập hàng"       , permission:"purchasePermission"   },
  { id:"all-orders"         , href:"/admin/all-orders"    , icon:"fi fi-rr-piggy-bank"  , label:"Đơn Hàng"        , permission:"orderPermission"      },
  { id:"all-stores"         , href:"/admin/all-stores"    , icon:"fi fi-rr-store-alt"   , label:"Đại lý"          , permission:"storePermission"      },
  { id:"all-products"       , href:"/admin/all-products"  , icon:"fi fi-rr-box-open"    , label:"Sản Phẩm"        , permission:"productPermission"    },
  // { id:"all-materials"      , href:"/admin/all-materials" , icon:"fi fi-rr-box-open"    , label:"Nguyên liệu"     , permission:"materialPermission"   },
  { id:"all-employees"      , href:"/admin/all-employees" , icon:"fi fi-rr-employees"   , label:"Nhân sự"         , permission:"employeePermission"   },
  { id:"all-suppliers"      , href:"/admin/all-suppliers" , icon:"fi fi-rr-supplier"    , label:"Nhà cung cấp"    , permission:"supplierPermission"   },
  { id:"all-brands"         , href:"/admin/all-brands"    , icon:"fi fi-rr-brand"       , label:"Thương hiệu"     , permission:"brandPermission"      },
  { id:"all-attributes"     , href:"/admin/all-attributes", icon:"fi fi-rr-ballot"      , label:"Thuộc tính"      , permission:"attributePermission"  },
]

export const footerMenu = [
  { id:"all-personal-info", href:"/admin/all-personal-info", icon:"fi fi-rr-circle-user", label:"Thông Tin Cá Nhân" },
  { id:"log-out",           href:"/admin/log-out",           icon:"fi fi-rr-exit",        label:"Đăng Xuất" }
]