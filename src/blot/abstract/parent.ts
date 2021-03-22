import LinkedList from '../../collection/linked-list';
import ParchmentError from '../../error';
import Scope from '../../scope';
import { Blot, BlotConstructor, Parent, Root } from './blot';
import ShadowBlot from './shadow';

function makeAttachedBlot(node: Node, scroll: Root): Blot {
  let blot = scroll.find(node);
  if (blot == null) {
    try {
      blot = scroll.create(node);
    } catch (e) {
      blot = scroll.create(Scope.INLINE) as Blot;
      Array.from(node.childNodes).forEach((child: Node) => {
        // @ts-ignore
        blot.domNode.appendChild(child);
      });
      if (node.parentNode) {
        node.parentNode.replaceChild(blot.domNode, node);
      }
      blot.attach();
    }
  }
  return blot as Blot;
}

class ParentBlot extends ShadowBlot implements Parent {
  public static allowedChildren: BlotConstructor[] | null;
  public static defaultChild: BlotConstructor | null;
  public static uiClass = '';

  public children!: LinkedList<Blot>;
  public domNode!: HTMLElement;
  public uiNode: HTMLElement | null = null;

  constructor(scroll: Root, domNode: Node) {
    super(scroll, domNode);
    this.build();
  }

  public appendChild(other: Blot): void {
    this.insertBefore(other);
  }

  public attach(): void {
    super.attach();
    this.children.forEach((child) => {
      child.attach();
    });
  }

  public attachUI(node: HTMLElement): void {
    if (this.uiNode != null) {
      this.uiNode.remove();
    }
    this.uiNode = node;
    if (ParentBlot.uiClass) {
      this.uiNode.classList.add(ParentBlot.uiClass);
    }
    this.uiNode.setAttribute('contenteditable', 'false');
    this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
  }

  public build(): void {
    this.children = new LinkedList<Blot>();
    // Need to be reversed for if DOM nodes already in order
    Array.from(this.domNode.childNodes)
      .filter((node: Node) => node !== this.uiNode)
      .reverse()
      .forEach((node: Node) => {
        try {
          const child = makeAttachedBlot(node, this.scroll);
          this.insertBefore(child, this.children.head || undefined);
        } catch (err) {
          if (err instanceof ParchmentError) {
            return;
          } else {
            throw err;
          }
        }
      });
  }

  public deleteAt(index: number, length: number, avoidRemove = false): void {
    if (index === 0 && length === this.length() && !avoidRemove) {
      return this.remove();
    }
    this.children.forEachAt(index, length, (child, offset, childLength) => {
      child.deleteAt(offset, childLength);
    });
  }

  public descendant(
    criteria: new () => Blot,
    index: number,
  ): [Blot | null, number];
  public descendant(
    criteria: (blot: Blot) => boolean,
    index: number,
  ): [Blot | null, number];
  public descendant(criteria: any, index = 0): [Blot | null, number] {
    const [child, offset] = this.children.find(index);
    if (
      (criteria.blotName == null && criteria(child)) ||
      (criteria.blotName != null && child instanceof criteria)
    ) {
      return [child as any, offset];
    } else if (child instanceof ParentBlot) {
      return child.descendant(criteria, offset);
    } else {
      return [null, -1];
    }
  }

  public descendants(
    criteria: new () => Blot,
    index: number,
    length: number,
  ): Blot[];
  public descendants(
    criteria: (blot: Blot) => boolean,
    index: number,
    length: number,
  ): Blot[];
  public descendants(
    criteria: any,
    index = 0,
    length: number = Number.MAX_VALUE,
  ): Blot[] {
    let descendants: Blot[] = [];
    let lengthLeft = length;
    this.children.forEachAt(
      index,
      length,
      (child: Blot, childIndex: number, childLength: number) => {
        if (
          (criteria.blotName == null && criteria(child)) ||
          (criteria.blotName != null && child instanceof criteria)
        ) {
          descendants.push(child);
        }
        if (child instanceof ParentBlot) {
          descendants = descendants.concat(
            child.descendants(criteria, childIndex, lengthLeft),
          );
        }
        lengthLeft -= childLength;
      },
    );
    return descendants;
  }

  public detach(): void {
    this.children.forEach((child) => {
      child.detach();
    });
    super.detach();
  }

  public enforceAllowedChildren(): void {
    let done = false;
    this.children.forEach((child: Blot) => {
      if (done) {
        return;
      }
      const allowed = this.statics.allowedChildren.some(
        (def: BlotConstructor) => child instanceof def,
      );
      if (allowed) {
        return;
      }
      if (child.statics.scope === Scope.BLOCK_BLOT) {
        if (child.next != null) {
          this.splitAfter(child);
        }
        if (child.prev != null) {
          this.splitAfter(child.prev);
        }
        child.parent.unwrap();
        done = true;
      } else if (child instanceof ParentBlot) {
        child.unwrap();
      } else {
        child.remove();
      }
    });
  }

  public formatAt(
    index: number,
    length: number,
    name: string,
    value: any,
  ): void {
    this.children.forEachAt(index, length, (child, offset, childLength) => {
      child.formatAt(offset, childLength, name, value);
    });
  }

  public insertAt(index: number, value: string, def?: any): void {
    const [child, offset] = this.children.find(index);
    if (child) {
      child.insertAt(offset, value, def);
    } else {
      const blot =
        def == null
          ? this.scroll.create('text', value)
          : this.scroll.create(value, def);
      this.appendChild(blot);
    }
  }

  public insertBefore(childBlot: Blot, refBlot?: Blot | null): void {
    if (childBlot.parent != null) {
      childBlot.parent.children.remove(childBlot);
    }
    let refDomNode: Node | null = null;
    this.children.insertBefore(childBlot, refBlot || null);
    childBlot.parent = this;
    if (refBlot != null) {
      refDomNode = refBlot.domNode;
    }
    if (
      this.domNode.parentNode !== childBlot.domNode ||
      this.domNode.nextSibling !== refDomNode
    ) {
      this.domNode.insertBefore(childBlot.domNode, refDomNode);
    }
    childBlot.attach();
  }

  public length(): number {
    return this.children.reduce((memo, child) => {
      return memo + child.length();
    }, 0);
  }

  public moveChildren(targetParent: Parent, refNode?: Blot): void {
    this.children.forEach((child) => {
      targetParent.insertBefore(child, refNode);
    });
  }

  public optimize(context: { [key: string]: any }): void {
    super.optimize(context);
    this.enforceAllowedChildren();
    if (this.uiNode != null && this.uiNode !== this.domNode.firstChild) {
      this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
    }
    if (this.children.length === 0) {
      if (this.statics.defaultChild != null) {
        const child = this.scroll.create(this.statics.defaultChild.blotName);
        this.appendChild(child);
        // TODO double check if necessary
        // child.optimize(context);
      } else {
        this.remove();
      }
    }
  }

  public path(index: number, inclusive = false): [Blot, number][] {
    const [child, offset] = this.children.find(index, inclusive);
    const position: [Blot, number][] = [[this, index]];
    if (child instanceof ParentBlot) {
      return position.concat(child.path(offset, inclusive));
    } else if (child != null) {
      position.push([child, offset]);
    }
    return position;
  }

  public removeChild(child: Blot): void {
    this.children.remove(child);
  }

  public replaceWith(name: string | Blot, value?: any): Blot {
    const replacement =
      typeof name === 'string' ? this.scroll.create(name, value) : name;
    if (replacement instanceof ParentBlot) {
      this.moveChildren(replacement);
    }
    return super.replaceWith(replacement);
  }

  public split(index: number, force = false): Blot | null {
    if (!force) {
      if (index === 0) {
        return this;
      }
      if (index === this.length()) {
        return this.next;
      }
    }
    const after = this.clone() as ParentBlot;
    if (this.parent) {
      this.parent.insertBefore(after, this.next || undefined);
    }
    this.children.forEachAt(index, this.length(), (child, offset, _length) => {
      const split = child.split(offset, force);
      if (split != null) {
        after.appendChild(split);
      }
    });
    return after;
  }

  public splitAfter(child: Blot): Parent {
    const after = this.clone() as ParentBlot;
    while (child.next != null) {
      after.appendChild(child.next);
    }
    if (this.parent) {
      this.parent.insertBefore(after, this.next || undefined);
    }
    return after;
  }

  public unwrap(): void {
    if (this.parent) {
      this.moveChildren(this.parent, this.next || undefined);
    }
    this.remove();
  }

  public update(
    mutations: MutationRecord[],
    _context: { [key: string]: any },
  ): void {
    const addedNodes: Node[] = [];
    const removedNodes: Node[] = [];
    mutations.forEach((mutation) => {
      if (mutation.target === this.domNode && mutation.type === 'childList') {
        addedNodes.push(...mutation.addedNodes);
        removedNodes.push(...mutation.removedNodes);
      }
    });
    removedNodes.forEach((node: Node) => {
      // Check node has actually been removed
      // One exception is Chrome does not immediately remove IFRAMEs
      // from DOM but MutationRecord is correct in its reported removal
      if (
        node.parentNode != null &&
        // @ts-ignore
        node.tagName !== 'IFRAME' &&
        document.body.compareDocumentPosition(node) &
          Node.DOCUMENT_POSITION_CONTAINED_BY
      ) {
        return;
      }
      const blot = this.scroll.find(node);
      if (blot == null) {
        return;
      }
      if (
        blot.domNode.parentNode == null ||
        blot.domNode.parentNode === this.domNode
      ) {
        blot.detach();
      }
    });
    addedNodes
      .filter((node) => {
        return node.parentNode === this.domNode || node === this.uiNode;
      })
      .sort((a, b) => {
        if (a === b) {
          return 0;
        }
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
          return 1;
        }
        return -1;
      })
      .forEach((node) => {
        let refBlot: Blot | null = null;
        if (node.nextSibling != null) {
          refBlot = this.scroll.find(node.nextSibling);
        }
        const blot = makeAttachedBlot(node, this.scroll);
        if (blot.next !== refBlot || blot.next == null) {
          if (blot.parent != null) {
            blot.parent.removeChild(this);
          }
          this.insertBefore(blot, refBlot || undefined);
        }
      });
    this.enforceAllowedChildren();
  }
}

export default ParentBlot;
