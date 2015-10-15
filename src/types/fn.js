// register custom element prototype (render is automatic)
export default function fn(ripple) {
  return res => {
    if (!customs || registered(res)) 
      return all(`${res.name}:not([inert])
                 ,[is="${res.name}"]:not([inert])`)
              .map(ripple.draw)  

    var proto = Object.create(HTMLElement.prototype)
      , opts = { prototype: proto }
      , extend = res.headers['extends']

    extend && (opts.extends = extend)
    proto.attachedCallback = 
    proto.attributeChangedCallback =
      ripple.draw
    document.registerElement(res.name, opts)
  }
}

function registered(res) {
  var extend = header('extends')(res)
    
  return extend ? document.createElement(extend, res.name).attachedCallback
                : document.createElement(res.name).attachedCallback
}

import header from 'utilise/header'
import client from 'utilise/client'
import all from 'utilise/all'
var customs = client && !!document.registerElement