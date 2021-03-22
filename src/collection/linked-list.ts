import LinkedNode from './linked-node';

class LinkedList<T extends LinkedNode> {
  public head: T | null;
  public tail: T | null;
  public length: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  public append(...nodes: T[]): void {
    this.insertBefore(nodes[0], null);
    if (nodes.length > 1) {
      const rest = nodes.slice(1);
      this.append(...rest);
    }
  }

  public at(index: number): T | null {
    const next = this.iterator();
    let cur = next();
    while (cur && index > 0) {
      index -= 1;
      cur = next();
    }
    return cur;
  }

  public contains(node: T): boolean {
    const next = this.iterator();
    let cur = next();
    while (cur) {
      if (cur === node) {
        return true;
      }
      cur = next();
    }
    return false;
  }

  public indexOf(node: T): number {
    const next = this.iterator();
    let cur = next();
    let index = 0;
    while (cur) {
      if (cur === node) {
        return index;
      }
      index += 1;
      cur = next();
    }
    return -1;
  }

  public insertBefore(node: T | null, refNode: T | null): void {
    if (node == null) {
      return;
    }
    this.remove(node);
    node.next = refNode;
    if (refNode != null) {
      node.prev = refNode.prev;
      if (refNode.prev != null) {
        refNode.prev.next = node;
      }
      refNode.prev = node;
      if (refNode === this.head) {
        this.head = node;
      }
    } else if (this.tail != null) {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    } else {
      node.prev = null;
      this.head = this.tail = node;
    }
    this.length += 1;
  }

  public offset(target: T): number {
    let index = 0;
    let cur = this.head;
    while (cur != null) {
      if (cur === target) {
        return index;
      }
      index += cur.length();
      cur = cur.next as T;
    }
    return -1;
  }

  public remove(node: T): void {
    if (!this.contains(node)) {
      return;
    }
    if (node.prev != null) {
      node.prev.next = node.next;
    }
    if (node.next != null) {
      node.next.prev = node.prev;
    }
    if (node === this.head) {
      this.head = node.next as T;
    }
    if (node === this.tail) {
      this.tail = node.prev as T;
    }
    this.length -= 1;
  }

  public iterator(curNode: T | null = this.head): () => T | null {
    // TODO use yield when we can
    return (): T | null => {
      const ret = curNode;
      if (curNode != null) {
        curNode = curNode.next as T;
      }
      return ret;
    };
  }

  public find(index: number, inclusive = false): [T | null, number] {
    const next = this.iterator();
    let cur = next();
    while (cur) {
      const length = cur.length();
      if (
        index < length ||
        (inclusive &&
          index === length &&
          (cur.next == null || cur.next.length() !== 0))
      ) {
        return [cur, index];
      }
      index -= length;
      cur = next();
    }
    return [null, 0];
  }

  public forEach(callback: (cur: T) => void): void {
    const next = this.iterator();
    let cur = next();
    while (cur) {
      callback(cur);
      cur = next();
    }
  }

  public forEachAt(
    index: number,
    length: number,
    callback: (cur: T, offset: number, length: number) => void,
  ): void {
    if (length <= 0) {
      return;
    }
    const [startNode, offset] = this.find(index, true);
    let curIndex = index - offset;
    const next = this.iterator(startNode);
    let cur = next();
    while (cur && curIndex < index + length) {
      const curLength = cur.length();
      if (index > curIndex) {
        callback(
          cur,
          index - curIndex,
          Math.min(length, curIndex + curLength - index),
        );
      } else {
        callback(cur, 0, Math.min(curLength, index + length - curIndex));
      }
      curIndex += curLength;
      cur = next();
    }
  }

  public map(callback: (cur: T) => any): any[] {
    return this.reduce((memo: T[], cur: T) => {
      memo.push(callback(cur));
      return memo;
    }, []);
  }

  public reduce<M>(callback: (memo: M, cur: T) => M, memo: M): M {
    const next = this.iterator();
    let cur = next();
    while (cur) {
      memo = callback(memo, cur);
      cur = next();
    }
    return memo;
  }
}

export default LinkedList;
