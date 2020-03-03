import Attributor from './attributor/attributor';
import { Blot, BlotConstructor, Root } from './blot/abstract/blot';
import ParchmentError from './error';
import Scope from './scope';

export interface RegistryInterface {
  create(sroll: Root, input: Node | string | Scope, value?: any): Blot;
  query(
    query: string | Node | Scope,
    scope: Scope,
  ): Attributor | BlotConstructor | null;
  register(...definitions: any[]): any;
}

export default class Registry implements RegistryInterface {
  public static blots = new WeakMap<Node, Blot>();

  public static find(node: Node | null, bubble: boolean = false): Blot | null {
    if (node == null) {
      return null;
    }
    if (this.blots.has(node)) {
      return this.blots.get(node) || null;
    }
    if (bubble) {
      return this.find(node.parentNode, bubble);
    }
    return null;
  }

  private attributes: { [key: string]: Attributor } = {};
  private classes: { [key: string]: BlotConstructor } = {};
  private tags: { [key: string]: BlotConstructor } = {};
  private types: { [key: string]: Attributor | BlotConstructor } = {};

  public create(scroll: Root, input: Node | string | Scope, value?: any): Blot {
    const match = this.query(input);
    if (match == null) {
      throw new ParchmentError(`Unable to create ${input} blot`);
    }
    const blotClass = match as BlotConstructor;
    const node =
      // @ts-ignore
      this.isNode(input) || input.nodeType === Node.TEXT_NODE
        ? input
        : blotClass.create(value);

    const blot = new blotClass(scroll, node as Node, value);
    Registry.blots.set(blot.domNode, blot);
    return blot;
  }

  public find(node: Node | null, bubble: boolean = false): Blot | null {
    return Registry.find(node, bubble);
  }

  public query(
    query: string | Node | Scope,
    scope: Scope = Scope.ANY,
  ): Attributor | BlotConstructor | null {
    let match;
    if (typeof query === 'string') {
      match = this.types[query] || this.attributes[query];
      // @ts-ignore
    } else if (query instanceof Text || query.nodeType === Node.TEXT_NODE) {
      match = this.types.text;
    } else if (typeof query === 'number') {
      if (query & Scope.LEVEL & Scope.BLOCK) {
        match = this.types.block;
      } else if (query & Scope.LEVEL & Scope.INLINE) {
        match = this.types.inline;
      }
    } else if (this.isHTMLElement(query)) {
      const names = (query.getAttribute('class') || '').split(/\s+/);
      names.some(name => {
        match = this.classes[name];
        if (match) {
          return true;
        }
        return false;
      });
      match = match || this.tags[query.tagName];
    }
    if (match == null) {
      return null;
    }
    // @ts-ignore
    if (scope & Scope.LEVEL & match.scope && scope & Scope.TYPE & match.scope) {
      return match;
    }
    return null;
  }

  public register(...definitions: any[]): any {
    if (definitions.length > 1) {
      return definitions.map(d => {
        return this.register(d);
      });
    }
    const definition = definitions[0];
    if (
      typeof definition.blotName !== 'string' &&
      typeof definition.attrName !== 'string'
    ) {
      throw new ParchmentError('Invalid definition');
    } else if (definition.blotName === 'abstract') {
      throw new ParchmentError('Cannot register abstract class');
    }
    this.types[definition.blotName || definition.attrName] = definition;
    if (typeof definition.keyName === 'string') {
      this.attributes[definition.keyName] = definition;
    } else {
      if (definition.className != null) {
        this.classes[definition.className] = definition;
      }
      if (definition.tagName != null) {
        if (Array.isArray(definition.tagName)) {
          definition.tagName = definition.tagName.map((tagName: string) => {
            return tagName.toUpperCase();
          });
        } else {
          definition.tagName = definition.tagName.toUpperCase();
        }
        const tagNames = Array.isArray(definition.tagName)
          ? definition.tagName
          : [definition.tagName];
        tagNames.forEach((tag: string) => {
          if (this.tags[tag] == null || definition.className == null) {
            this.tags[tag] = definition;
          }
        });
      }
    }
    return definition;
  }

  private isHTMLElement(value: any): value is HTMLElement {
    if (value.ownerDocument === undefined) {
      return false;
    }

    const elementWindow = value.ownerDocument.defaultView || value.ownerDocument.parentWindow;
    return value instanceof HTMLElement
      || value instanceof elementWindow.HTMLElement;
  }
  
  private isNode(value: any): value is Node {
    if (value.ownerDocument === undefined) {
      return false;
    }

    const elementWindow = value.ownerDocument.defaultView || value.ownerDocument.parentWindow;
    return value instanceof Node
      || value instanceof elementWindow.Node;
  }
}
