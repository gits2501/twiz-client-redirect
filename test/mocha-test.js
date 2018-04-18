
var assert = require('assert');
console.log('assert:', assert)
describe('Redirect', function(){

   it('should redirect', function(){

      assert('lolza');
   })
  
   it('true is fine', function(){
     assert('ok')
   })

   describe('No redirection', function(){
      it('no redir',function(){
         assert.deepEqual({},{}, 'fine objects')
      })
   })
})
