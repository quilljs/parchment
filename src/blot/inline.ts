import Attributor from '../attributor/attributor';
import AttributorStore from '../attributor/store';
import Scope from '../scope';
import {
  Blot,
  BlotConstructor,
  Formattable,
  Parent,
  Root,
} from './abstract/blot';
import LeafBlot from './abstract/leaf';
import ParentBlot from './abstract/parent';

// Shallow object comparison
function isEqual(obj1: object, obj2: object): boolean {
  if (Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false;
  }
  // @ts-ignore
  for (const prop in obj1) {
    // @ts-ignore
    if (obj1[prop] !== obj2[prop]) {
      return false;
    }
  }
  return true;
}

class InlineBlot extends ParentBlot implements Formattable {
  public static allowedChildren: BlotConstructor[] = [InlineBlot, LeafBlot];
  public static blotName = 'inline';
  public static scope = Scope.INLINE_BLOT;
  public static tagName = 'SPAN';

  public static formats(domNode: HTMLElement, scroll: Root): any {
    const match = scroll.query(InlineBlot.blotName);
    if (
      match != null &&
      domNode.tagName === (match as BlotConstructor).tagName
    ) {
      return undefined;
    } else if (typeof this.tagName === 'string') {
      return true;
    } else if (Array.isArray(this.tagName)) {
      return domNode.tagName.toLowerCase();
    }
    return undefined;
  }

  protected attributes: AttributorStore;

  constructor(scroll: Root, domNode: Node) {
    super(scroll, domNode);
    this.attributes = new AttributorStore(this.domNode);
  }

  public deleteAt(index: number, length: number): void {
    const avoidRemove =
      this.parent.children.indexOf(this) === 0 &&
      this.parent.children.length === 1;
    super.deleteAt(index, length, avoidRemove);
  }

  public format(name: string, value: any): void {
    if (name === this.statics.blotName && !value) {
      this.children.forEach((child) => {
        if (!(child instanceof InlineBlot)) {
          child = child.wrap(InlineBlot.blotName, true);
        }
        this.attributes.copy(child as InlineBlot);
      });
      this.unwrap();
    } else {
      const format = this.scroll.query(name, Scope.INLINE);
      if (format == null) {
        return;
      }
      if (format instanceof Attributor) {
        this.attributes.attribute(format, value);
      } else if (
        value &&
        (name !== this.statics.blotName || this.formats()[name] !== value)
      ) {
        this.replaceWith(name, value);
      }
    }
  }

  public formats(): { [index: string]: any } {
    const formats = this.attributes.values();
    const format = this.statics.formats(this.domNode, this.scroll);
    if (format != null) {
      formats[this.statics.blotName] = format;
    }
    return formats;
  }

  public formatAt(
    index: number,
    length: number,
    name: string,
    value: any,
  ): void {
    if (
      this.formats()[name] != null ||
      this.scroll.query(name, Scope.ATTRIBUTE)
    ) {
      const blot = this.isolate(index, length) as InlineBlot;
      blot.format(name, value);
    } else {
      super.formatAt(index, length, name, value);
    }
  }

  public optimize(context: { [key: string]: any }): void {
    super.optimize(context);
    const formats = this.formats();
    if (Object.keys(formats).length === 0) {
      return this.unwrap(); // unformatted span
    }
    const next = this.next;
    if (
      next instanceof InlineBlot &&
      next.prev === this &&
      isEqual(formats, next.formats())
    ) {
      next.moveChildren(this);
      next.remove();
    }
  }

  public replaceWith(name: string | Blot, value?: any): Blot {
    const replacement = super.replaceWith(name, value) as InlineBlot;
    this.attributes.copy(replacement);
    return replacement;
  }

  public update(
    mutations: MutationRecord[],
    context: { [key: string]: any },
  ): void {
    super.update(mutations, context);
    const attributeChanged = mutations.some(
      (mutation) =>
        mutation.target === this.domNode && mutation.type === 'attributes',
    );
    if (attributeChanged) {
      this.attributes.build();
    }
  }

  public wrap(name: string | Parent, value?: any): Parent {
    const wrapper = super.wrap(name, value);
    if (wrapper instanceof InlineBlot) {
      this.attributes.move(wrapper);
    }
    return wrapper;
  }
}

export default InlineBlot;
