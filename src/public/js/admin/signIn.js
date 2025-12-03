importLinkCss('/css/layouts/signIn.css')
const permissions = {
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
const menuConfig = [
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

async function checkingAccount() {
  document.querySelector('button').classList.add('loading')

  const email = document.querySelector('input#email').value
  const password = document.querySelector('input#password').value
  const response = await fetch("/emp/authentication/checking-account", {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: email,
      password: password
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {isValid, message, role} = await response.json()

  document.querySelector('button').classList.remove('loading')
  
  if (!isValid) {
    document.querySelector('p.wrong-info').textContent = message
    document.querySelector('p.wrong-info').style.color = 'red'
    return 
  }
  
  if (!role) {
    pushNotification('Something went wrong. Please try again!')
    return
  }

  document.querySelector('p.wrong-info').textContent = ''
  pushNotification(message)

  function getRedirectUrlByRole(role) {
    for (const item of menuConfig) {
      if (permissions[item.permission].includes(role)) {
        return item.href
      }
    }
    return "/403" // fallback if no permission
  }

  const redirectUrl = getRedirectUrlByRole(role)

  setTimeout(() => {
    const path = window.location.origin
    window.location.replace(path + redirectUrl)
  }, 1000)
  
  return
}

document.querySelector("form").addEventListener("submit", function(event) {
  event.preventDefault() // Prevents form submission
  checkingAccount()
})