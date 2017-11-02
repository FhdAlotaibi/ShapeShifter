import { transitionToClass } from '../utils';

export default class MainUi {
  private _activated: boolean;
  private _toActivate: any;

  constructor(...elements) {
    this._activated = false;
    this._toActivate = elements;
  }

  activate() {
    if (this._activated) return undefined;
    this._activated = true;

    return Promise.all(this._toActivate.map(el => transitionToClass(el)));
  }
}
