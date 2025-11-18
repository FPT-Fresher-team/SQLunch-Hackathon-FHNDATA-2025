class introduceController {
  show(req, res, next) { 
    return res.render('users/introduce', { title: 'Giới thiệu về Beauté' })
  }
}
module.exports = new introduceController