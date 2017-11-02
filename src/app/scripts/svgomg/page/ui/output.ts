import { strToEl, transitionFromClass, transitionToClass } from '../utils';
import CodeOutput from './code-output';
import SvgOutput from './svg-output';

export default class Output {
  container: any;
  private _types: any;
  private _svgFile: any;
  private _switchQueue: any;
  private _activeType: any;

  constructor() {
    this.container = strToEl('<div class="output-switcher"></div>' + '');

    this._types = {
      image: new SvgOutput(),
      code: new CodeOutput(),
    };

    this._svgFile = null;
    this._switchQueue = Promise.resolve();
    this.set('image', { noAnimate: true });
  }

  update(svgFile) {
    this._svgFile = svgFile;
    return this._types[this._activeType].setSvg(svgFile);
  }

  reset() {
    this._types[this._activeType].reset();
  }

  set(type, { noAnimate = false } = {}) {
    return (this._switchQueue = this._switchQueue.then(async () => {
      const toRemove = this._activeType && this._types[this._activeType].container;

      this._activeType = type;
      const toAdd = this._types[this._activeType].container;
      this.container.appendChild(toAdd);

      if (this._svgFile) await this.update(this._svgFile);

      if (noAnimate) {
        toAdd.classList.add('active');
        if (toRemove) toRemove.classList.remove('active');
      } else {
        const transitions = [transitionToClass(toAdd)];

        if (toRemove) transitions.push(transitionFromClass(toRemove));

        await Promise.all<any>(transitions);
      }

      if (toRemove) this.container.removeChild(toRemove);
    }));
  }
}
