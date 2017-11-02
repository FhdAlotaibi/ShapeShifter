import Prism from '../prism';
import { strToEl } from '../utils';
const prism = new Prism();

export default class CodeOutput {
  container: any;
  private _codeEl: any;

  constructor() {
    this.container = strToEl(
      '<div class="code-output">' + '<pre><code></code></pre>' + '</div>' + '',
    );
    this._codeEl = this.container.querySelector('code');
  }

  async setSvg(svgFile) {
    this._codeEl.innerHTML = await prism.highlight(svgFile.text);
  }

  reset() {
    this._codeEl.innerHTML = '';
  }
}
