import { Directive, OnInit, Input } from '@angular/core';

/** 
 * To load external javascript files
 */
  
@Directive({
  selector: '[appLoadScript]'
})
export class LoadScriptDirectiveDirective implements OnInit{

  /** @ignore */
  @Input('script') param:  any;

  /** @ignore */
  ngOnInit() {
    let node = document.createElement('script');
    node.src = this.param;
    node.type = 'text/javascript';
    node.async = false;
    node.charset = 'utf-8';
    document.getElementsByTagName('head')[0].appendChild(node);
  }

  /** @ignore */
  constructor() { }

}
