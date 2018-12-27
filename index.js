module.exports = function components(ripple){
  if (!client) return ripple
  log('creating')


const styler =  async (node, ...names) => {
  return node.css$ = node.css$ || ripple
  .subscribe(names)
  .map(styles => names.map(name => style(node, styles[name], ripple.resources[name].headers.hash, name)))
  .each((d, i, n) => requestAnimationFrame(n.next))
  .start(node.on('disconnected').filter(() => !node.isConnected)) // TODO: test needed
}

const data = async (node, ...names) => {
  if (!node.data$) node.data$ = ripple
    .subscribe(names)
    .map(data => assign(node.state, data))
    .map(() => node.render())
    .start(node.once('disconnected'))

  return ripple.get(names)
}

  // if no render is defined on a component, load up definition
  Node.prototype.render = function(){
    const name = this.nodeName.toLowerCase()
    if (name.includes('-')) {
      this.state = this.state || {}
      return this.fn$ = this.fn$ || ripple
        .subscribe(name)
        .map(component => {
          const cls = customElements.define(name, class extends HTMLElement{

              constructor(){
                super()
                event(this)
              }

             static get observedAttributes() {
                 return ['data', 'css']
              }


              attributeChangedCallback(name, oldValue, newValue) {
                name == 'css'
                ? styler(this, ...newValue.split(' '))
                : data(this, ...newValue.split(' '))
                
              }

              connectedCallback(){
                this.render()
              }

              render(){
                component.call(this, this, this.state)
              }

          })
            
        })
          // TODO: test this works well across all instances
          // .until(new Promise(resolve => this.addEventListener('disconnected', () => {
          //   if (!this.isConnected) resolve()
          // })))
      }
    }
  
  // this is for backwards compatibility
  Node.prototype.draw = function(){ 
    this.render() 
  }

  ready(() => Array.from(document.querySelectorAll('*'))
    .filter(d => d.nodeName.includes('-'))
    .map(node => node.render())
  )

  return ripple
}

const log = require('utilise/log')('[ri/components]')
    , client = require('utilise/client')
    , ready = require('utilise/ready')
    , style = require('@compone/style')
    , event = require('@compone/event')
    , define = require('@compone/define')
    , { assign } = Object
