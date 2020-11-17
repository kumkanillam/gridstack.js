// dd-droppable.ts 2.2.0-dev @preserve

/**
 * https://gridstackjs.com/
 * (c) 2020 rhlin, Alain Dumesny
 * gridstack.js may be freely distributed under the MIT license.
*/
import { DDDraggable } from './dd-draggable';
import { DDManager } from './dd-manager';
import { DDBaseImplement, HTMLElementExtendOpt } from './dd-base-impl';
import { DDUtils } from './dd-utils';

export interface DDDroppableOpt {
  accept?: string | ((el: HTMLElement) => boolean);
  drop?: (event: DragEvent, ui) => void;
  over?: (event: DragEvent, ui) => void;
  out?: (event: DragEvent, ui) => void;
}

export class DDDroppable extends DDBaseImplement implements HTMLElementExtendOpt<DDDroppableOpt> {

  public accept: (el: HTMLElement) => boolean;
  public el: HTMLElement;
  public option: DDDroppableOpt;
  private acceptable: boolean = null;
  private style;

  constructor(el: HTMLElement, opts: DDDroppableOpt = {}) {
    super();
    this.el = el;
    this.option = opts;
    // create var event binding so we can easily remove and still look like TS methods (unlike anonymous functions)
    this.dragEnter = this.dragEnter.bind(this);
    this.dragOver = this.dragOver.bind(this);
    this.dragLeave = this.dragLeave.bind(this);
    this.drop = this.drop.bind(this);

    this.init();
  }

  public on(event: 'drop' | 'dropover' | 'dropout', callback: (event: DragEvent) => void): void {
    super.on(event, callback);
  }

  public off(event: 'drop' | 'dropover' | 'dropout'): void {
    super.off(event);
  }

  public enable(): void {
    if (!this.disabled) { return; }
    super.enable();
    this.el.classList.remove('ui-droppable-disabled');
    this.el.addEventListener('dragenter', this.dragEnter);
  }

  public disable(): void {
    if (this.disabled) { return; }
    super.disable();
    this.el.classList.add('ui-droppable-disabled');
    this.el.removeEventListener('dragenter', this.dragEnter);
  }

  public destroy(): void {
    this.el.classList.remove('ui-droppable');
    if (this.disabled) {
      this.el.classList.remove('ui-droppable-disabled');
      this.el.removeEventListener('dragenter', this.dragEnter);
      this.el.removeEventListener('dragover', this.dragOver);
      this.el.removeEventListener('drop', this.drop);
      this.el.removeEventListener('dragleave', this.dragLeave);
    }
    super.destroy();
  }

  public updateOption(opts: DDDroppableOpt): DDDroppable {
    Object.keys(opts).forEach(key => this.option[key] = opts[key]);
    this.setupAccept();
    return this;
  }

  protected init(): DDDroppable {
    this.el.classList.add('ui-droppable');
    this.el.addEventListener('dragenter', this.dragEnter);
    this.setupAccept();
    this.createStyleSheet();
    return this;
  }

  protected dragEnter(event: DragEvent): void {
    this.el.removeEventListener('dragenter', this.dragEnter);
    this.acceptable = this.canDrop();
    if (this.acceptable) {
      event.preventDefault();
      const ev = DDUtils.initEvent<DragEvent>(event, { target: this.el, type: 'dropover' });
      if (this.option.over) {
        this.option.over(ev, this.ui(DDManager.dragElement))
      }
      this.triggerEvent('dropover', ev);
      this.el.addEventListener('dragover', this.dragOver);
      this.el.addEventListener('drop', this.drop);
    }
    this.el.classList.add('ui-droppable-over');
    this.el.addEventListener('dragleave', this.dragLeave);
  }

  private dragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private dragLeave(event: DragEvent): void {
    if (this.el.contains(event.relatedTarget as HTMLElement)) { return; }
    this.el.removeEventListener('dragleave', this.dragLeave);
    this.el.classList.remove('ui-droppable-over');
    if (this.acceptable) {
      event.preventDefault();
      this.el.removeEventListener('dragover', this.dragOver);
      this.el.removeEventListener('drop', this.drop);
      const ev = DDUtils.initEvent<DragEvent>(event, { target: this.el, type: 'dropout' });
      if (this.option.out) {
        this.option.out(ev, this.ui(DDManager.dragElement))
      }
      this.triggerEvent('dropout', ev);
    }
    this.el.addEventListener('dragenter', this.dragEnter);
  }

  private drop(event: DragEvent): void {
    if (this.acceptable) {
      event.preventDefault();
      const ev = DDUtils.initEvent<DragEvent>(event, { target: this.el, type: 'drop' });
      if (this.option.drop) {
        this.option.drop(ev, this.ui(DDManager.dragElement))
      }
      this.triggerEvent('drop', ev);
      this.dragLeave({
        ...ev,
        relatedTarget: null,
        preventDefault: () => {
          // do nothing
        }
      });
    }
  }

  private canDrop(): boolean {
    return DDManager.dragElement && (!this.accept || this.accept(DDManager.dragElement.el));
  }

  private setupAccept(): DDDroppable {
    if (this.option.accept && typeof this.option.accept === 'string') {
      this.accept = (el: HTMLElement) => {
        return el.matches(this.option.accept as string)
      }
    } else {
      this.accept = this.option.accept as ((el: HTMLElement) => boolean);
    }
    return this;
  }

  // TODO: share this with other instances and when do remove ???
  private createStyleSheet(): DDDroppable {
    const content = `.ui-droppable.ui-droppable-over > *:not(.ui-droppable) {pointer-events: none;}`;
    this.style = document.createElement('style');
    this.style.innerText = content;
    this.el.appendChild(this.style);
    return this;
  }

  // TODO: not call
  private removeStyleSheet() {
    this.el.removeChild(this.style);
  }

  private ui(drag: DDDraggable) {
    return {
      draggable: drag.el,
      ...drag.ui()
    };
  }
}

