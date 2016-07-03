var expect = require('chai').expect
  , values = require('utilise/values')
  , attr = require('utilise/attr')
  , time = require('utilise/time')
  , once = require('utilise/once')
  , push = require('utilise/push')
  , key = require('utilise/key')
  , lo = require('utilise/lo')
  , components = require('./').default
  , core = require('rijs.core').default
  , data = require('rijs.data').default
  , fn = require('rijs.fn').default
  , container = document.createElement('div')

describe('Custom Elements', function(){

  before(function(){ document.body.appendChild(container) })
  after( function(){ document.body.removeChild(container) })
  
  beforeEach(function(){ 
    delete Node.prototype.draw
    container.innerHTML = ''
  })

  it('should decorate core with draw api', function(){
    var ripple = components(fn(data(core())))
    expect(typeof ripple.draw).to.equal('function')
    expect(typeof ripple.render).to.equal('function')
    expect(typeof document.head.draw).to.equal('function')
  })

  it('should draw a single node', function(done){  
    var el1 = once(container)('component-1', 1).node()
      , el2 = once(container)('component-2', 1).node()
      , ripple = components(fn(data(core())))
      , result1, result2
    
    ripple('component-1', function(){ result1 = this })
    ripple('component-2', function(){ result2 = this })
    
    expect(ripple.draw(el1)).to.equal(el1)
    expect(ripple.draw.call(el2)).to.equal(el2)

    time(40, function() {
      expect(result1).to.equal(el1)
      expect(result2).to.equal(el2)
      done()
    })

  })

  it('should draw a d3 node', function(done){  
    var el1 = once(container)('component-3', 1).node()
      , el2 = once(container)('component-4', 1).node()
      , ripple = components(fn(data(core())))
      , d31 = { node: function(){ return el1 } }
      , d32 = { node: function(){ return el2 } }
      , result1, result2

    ripple('component-3', function(){ result1 = this })
    ripple('component-4', function(){ result2 = this })

    expect(ripple.draw(d31)).to.equal(el1)
    expect(ripple.draw.call(d32)).to.equal(el2)

    time(20, function() {
      expect(result1).to.equal(el1)
      expect(result2).to.equal(el2)
      done()
    })
  })

  it('should draw a resource with single datum', function(done){
    var el = once(container)('component-5[data="array"]', 1).node()
      , ripple = components(fn(data(core())))
      , result

    ripple('array', [1, 2, 3])
    ripple('component-5', function(d){ result = d })

    time(20, function(){
      expect(result).to.eql({ array: [1, 2, 3] })
      done()
    })
  })

  it('should draw a resource with multiple data', function(done){
    var el = once(container)('component-6[data="array object"]', 1).node()
      , ripple = components(fn(data(core())))
      , result

    ripple('array', [1, 2, 3])
    ripple('object', { foo: 'bar' })
    ripple('component-6', function(d){ result = d })

    time(20, function(){
      expect(result).to.eql({ array: [1, 2, 3], object: { foo: 'bar' }})
      done()
    })
  })

  it('should draw a resource with d3 datum', function(done){
    var el = once(container)('component-7', 1).node()
      , ripple = components(fn(data(core())))
      , result

    el.__data__ = { foo: 'bar' }
    ripple('component-7', function(d){ result = d })

    time(20, function(){
      expect(result).to.eql({ foo: 'bar' })
      done()
    })
  })

  it('should draw a resource with local state', function(done){
    var el = once(container)('component-8', 1).node()
      , ripple = components(fn(data(core())))
      , result

    el.state = { focused: true }
    ripple('component-8', function(d){ result = d })

    time(20, function(){
      expect(result).to.eql({ focused: true })
      done()
    })
  })

  it('should draw a resource with combined data', function(done){
    var el = once(container)('component-9[data="array"]', 1).node()
      , ripple = components(fn(data(core())))
      , result

    el.__data__ = { foo: 'bar' }
    el.state = { focused: true }
    ripple('array', [1, 2, 3])
    ripple('component-9', function(d){ result = d })

    time(20, function(){
      expect(result)
        .to.eql({ focused: true, foo: 'bar', array: [1, 2, 3] })
        .to.eql(el.state)
      done()
    })
  })

  it('should draw a resource by name (data)', function(done){
    var el1 = once(container)('component-10[data="array"]', 1).node()
      , el2 = once(container)('component-11[data="object"]', 1).node()
      , el3 = once(container)('component-12', 1).node()
      , ripple = components(fn(data(core())))
      , result1, result2, result3

    ripple('array', [1, 2, 3])
    ripple('object', { foo: 'bar' })
    ripple('component-10', function(d){ result1 = this })
    ripple('component-11', function(d){ result2 = this })
    ripple('component-12', function(d){ result3 = this })
    expect(el1.pending).to.be.ok
    expect(el2.pending).to.be.ok
    expect(el3.pending).to.be.ok

    time(40, function() {
      expect(el1.pending).to.be.not.ok
      expect(el2.pending).to.be.not.ok
      expect(el3.pending).to.be.not.ok
      result1 = result2 = null
      ripple.draw('array')
      ripple.draw('object')
      ripple.draw('component-12')
      expect(el1.pending).to.be.ok
      expect(el2.pending).to.be.ok
      expect(el3.pending).to.be.ok

      time(40, function(){
        expect(el1.pending).to.be.not.ok
        expect(el2.pending).to.be.not.ok
        expect(el3.pending).to.be.not.ok
        expect(result1).to.be.eql(el1)
        expect(result2).to.be.eql(el2)
        expect(result3).to.be.eql(el3)
        done()
      })
    })
  })

  it('should redraw element via MutationObserver', function(done){  
    if (typeof MutationObserver == 'undefined') return done()
    var el = once(container)('component-13', 1).node()
      , ripple = components(fn(data(core())))
      , result 

    time(50 , function(){ el.innerHTML = 'foo' })
    time(100, function(){ expect(result).to.be.ok })
    time(150, done)

    var muto = new MutationObserver(ripple.draw)
      , conf = { characterData: true, subtree: true, childList: true }
      , result

    ripple('component-13', function(){ result = this })
    muto.observe(el, conf)
  })

  it('should draw everything', function(done){  
    var el1 = once(container)('component-14[data="array"]', 1).node()
      , el2 = once(container)('component-15[data="object"]', 1).node()
      , el3 = once(container)('component-16', 1).node()
      , ripple = components(fn(data(core())))
      , result1, result2, result3

    ripple('array')
    ripple('object')
    ripple('component-14', function(){ result1 = this })
    ripple('component-15', function(){ result2 = this })
    ripple('component-16', function(){ result3 = this })

    expect(ripple.draw()).to.eql([el1, el2, el3])

    time(20, function() {
      expect(result1).to.equal(el1)
      expect(result2).to.equal(el2)
      expect(result3).to.equal(el3)
      done()
    })
  })

  it('should not draw headless fragments', function(done){  
    var ripple = components(fn(data(core())))
      , frag = document.createElement('component-17')
      , result
                
    ripple('component-17', function(){ result = this })
    ripple.draw(frag)

    time(20, function() {
      expect(result).to.not.be.ok
      container.appendChild(frag)
      ripple.draw(frag)

      time(20, function() {
        expect(result).to.be.ok
        done()
      })
    })
  })

  it('should not draw inert elements', function(done){  
    var el = once(container)('component-18', 1).node()
      , ripple = components(fn(data(core())))
      , result

    attr(el, 'inert', '')
    ripple('component-18', function(){ result = this })
    
    ripple.draw(el)
    time(20, function(){ 
      expect(result).to.not.be.ok 

      attr(el, 'inert', false)
      ripple.draw(el)

      time(20, function() {
        expect(result).to.be.ok
        done()
      })
    })

  })

  it('should not draw if missing deps', function(done){  
    var el = once(container)('component-19[data="array"]', 1).node()
      , ripple = components(fn(data(core())))
      , result

    ripple('component-19', function(){ result = this })
    
    time(40, function(){
      expect(result).to.not.be.ok
      ripple('array', [])

      time(40, function(){
        expect(result).to.be.ok
        done()
      })
    })
  })

  it('should batch rAF draws', function(done){  
    var el = once(container)('component-20[data="array"]', 1).node()
      , ripple = components(fn(data(core())))
      , count = 0

    time(10, function(){
      ripple('array', [1, 2, 3])
      ripple('component-20', function(){ count++ })
      push(1)(ripple('array'))
      push(2)(ripple('array'))
      push(3)(ripple('array'))
      push(4)(ripple('array'))
      push(5)(ripple('array'))
      
      time(40, function(){
        expect(count).to.equal(1)
        expect(ripple('array')).to.eql([1,2,3,1,2,3,4,5])
        done()
      })
    })
  })

  it('should draw newly attached elements', function(done){
    var ripple = components(fn(data(core())))
      , count = 0

    time(10, function(){
      ripple('component-21', function(){ count++ })

      time(40, function(){
        expect(count).to.equal(0)
        once(container)('component-21', 1)
      })

      time(80, function(){
        expect(count).to.equal(1)
        done()
      })    
    })
  })

  it('should not fail if no elements via force redraw', function(){
    var el = once(container)('component-22', 1).node()
      , ripple = components(fn(data(core())))
  
    expect(ripple.draw()).to.be.eql([])
  })

  it('should not attempt to register non-custom elements', function(done){  
    var ripple = components(fn(data(core())))
      , original = document.registerElement
      , result

    document.registerElement = function(){ result = true }

    ripple('function', function(){ })

    time(40, function(){
      expect(result).to.not.be.ok
      document.registerElement = original
      done()
    })

  })

  it('should always extend existing state', function(done){  
    var el = once(container)('component-23[data="array"]', 1).node()
      , ripple = components(fn(data(core())))
      , results = []

    ripple('array', [1])
    ripple('component-23', function(){ results.push(this.state) })
    
    time(20, function() {
      ripple('array', [2])

      time(20, function() {
        expect(results[0]).to.equal(results[1])
        done()
      })
    })
  })

  it('should reset __data__', function(done){  
    var el = once(container)('component-24', 1).node()
      , ripple = components(fn(data(core())))

    el.__data__ = { foo: 1 }
    ripple('component-24', function(){ var s = this.state; time(50, function(){ s.bar = 2 }) })
    
    time(20, function() {
      expect(el.__data__).to.equal(el.state)
      expect(el.__data__).to.eql({ foo: 1 })
    })

    time(80, function() {
      expect(el.__data__).to.equal(el.state)
      expect(el.__data__).to.eql({ foo: 1, bar: 2 })
    })
    
    time(100, done)
  })

  it('should not redraw on attr change', function(done){  
    var el = once(container)('component-25', 1).node()
      , ripple = components(fn(data(core())))
      , result

    ripple('component-25', function(){ result = true })
    
    time(40, function(){ 
      result = false
      attr(el, 'foo', 'bar')
    })

    time(80, function() {
      expect(result).to.not.be.ok
      done()
    })
  })

  it('should pass index as implicit data', function(done){
    var el = once(container)('component-26', 1).node()
      , ripple = components(fn(data(core())))
      , result

    ripple('component-26', function(d, i){ result = i })
    
    time(40, function(){ 
      expect(result).to.be.eql(0)
      done()
    })
  })

  it('should draw server-rendered elements', function(done){
    var ripple = components(fn(data(core())))
      , result

    ripple('component-27', function(){ result = true })
    container.appendChild(document.createElement('component-27'))

    time(40, function(){
      expect(result).to.be.ok
      done()
    })
  })

  it('should make changes accessible', function(done){
    var ripple = components(fn(data(core())))
      , result

    once(container)('component-28[data="foo"]', 1)
    ripple('component-28', function(){ result = this.change })
    ripple('foo', [{ bar: 5 }, { baz: 10 }])

    time(50, function(){
      result = null
      update('bar', 15)(ripple('foo'))
      update('baz', 25)(ripple('foo'))
    })

    time(100, function(){
      expect(result).to.eql([
        ['foo', { type: 'update', key: 'bar', value: 15, time: 1}]
      , ['foo', { type: 'update', key: 'baz', value: 25, time: 2}]
      ])
      done()
    })
  })

  it('should pass root as parameter', function(done){
    var elA = once(container)('component-29', 1).node()
      , elB = once(container)('component-30', 1).node()
      , ripple = components(fn(data(core())))
      , result1, result2

    Object.defineProperty(elB, 'shadowRoot', { value: elA })
    ripple('component-29', function(d, i, el){ result1 = el })
    ripple('component-30', function(d, i, el){ result2 = el })
    
    time(40, function(){ 
      expect(lo(result1.nodeName)).to.be.eql('component-29')
      expect(lo(result2.nodeName)).to.be.eql('component-29')
      done()
    })
  })
})