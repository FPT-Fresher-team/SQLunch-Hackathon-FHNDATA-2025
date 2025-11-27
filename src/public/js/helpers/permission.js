export const permissions = {
  attributePermission : ['admin', 'manager'],
  brandPermission     : ['admin', 'manager'],
  blogPermission      : ['admin', 'manager'],
  chatPermission      : ['chat' , 'admin'],
  customerPermission  : ['admin', 'manager', 'employee'],
  employeePermission  : ['admin', 'manager'],
  homePermission      : ['admin', 'manager'],
  orderPermission     : ['admin', 'manager', 'employee', 'merchandise', 'shipper'], 
  productPermission   : ['admin', 'manager', 'employee'],
  purchasePermission  : ['admin', 'manager', 'merchandise'],
  storePermission     : ['admin', 'manager'],
  supplierPermission  : ['admin', 'manager', 'merchandise'],
  voucherPermission   : ['admin', 'manager', 'employee'],
}

export const menuConfig = [
  { id:"all"                , href:"/admin/all"           , icon:"fi fi-rr-home"         , label:"Reports"        , permission:"homePermission"       },
  { id:"all-customers"      , href:"/admin/all-customers" , icon:"fi fi-rr-users"        , label:"Customers"      , permission:"customerPermission"   },
  { id:"all-blogs"          , href:"/admin/all-blogs"     , icon:"fi fi-rr-browser"      , label:"Blogs"          , permission:"blogPermission"       },
  { id:"all-vouchers"       , href:"/admin/all-vouchers"  , icon:"fi fi-rr-ticket"       , label:"Vouchers"       , permission:"voucherPermission"    },
  { id:"all-u-vouchers"     , href:"/admin/all-u-vouchers", icon:"fi fi-rr-ticket"       , label:"User Vouchers"  , permission:"voucherPermission"    },
  { id:"all-chats"          , href:"/admin/all-chats"     , icon:"fi fi-rr-comment"      , label:"Chat"           , permission:"chatPermission"       },
  { id:"all-orders"         , href:"/admin/all-orders"    , icon:"fi fi-rr-shopping-cart", label:"Orders"         , permission:"orderPermission"      },
  { id:"all-purchases"      , href:"/admin/all-purchases" , icon:"fi fi-rr-file-import"  , label:"Purchases"      , permission:"purchasePermission"   },
  { id:"all-stores"         , href:"/admin/all-stores"    , icon:"fi fi-rr-store-alt"    , label:"Stores"         , permission:"storePermission"      },
  { id:"all-products"       , href:"/admin/all-products"  , icon:"fi fi-rr-box-open"     , label:"Products"       , permission:"productPermission"    },
  { id:"all-employees"      , href:"/admin/all-employees" , icon:"fi fi-rr-employees"    , label:"Employees"      , permission:"employeePermission"   },
  { id:"all-suppliers"      , href:"/admin/all-suppliers" , icon:"fi fi-rr-supplier"     , label:"Suppliers"      , permission:"supplierPermission"   },
  { id:"all-brands"         , href:"/admin/all-brands"    , icon:"fi fi-rr-brand"        , label:"Brands"         , permission:"brandPermission"      },
  { id:"all-attributes"     , href:"/admin/all-attributes", icon:"fi fi-rr-ballot"       , label:"Attributes"     , permission:"attributePermission"  },
]

export const footerMenu = [
  { id:"all-personal-info", href:"/admin/all-personal-info", icon:"fi fi-rr-circle-user", label:"Personal Info" },
  { id:"log-out",           href:"/admin/log-out",           icon:"fi fi-rr-exit",        label:"Log Out" }
]