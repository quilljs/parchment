'use strict';

describe('LinkedList', function () {
  beforeEach(function () {
    this.list = new LinkedList();
    this.a = { str: 'a' };
    this.b = { str: 'b' };
    this.c = { str: 'c' };
    this.zero = {
      str: '!',
      length: function () {
        return 0;
      },
    };
    this.a.length = this.b.length = this.c.length = function () {
      return 3;
    };
  });

  describe('manipulation', function () {
    it('append to empty list', function () {
      this.list.append(this.a);
      expect(this.list.length).toBe(1);
      expect(this.list.head).toBe(this.a);
      expect(this.list.tail).toBe(this.a);
      expect(this.a.prev).toBeNull();
      expect(this.a.next).toBeNull();
    });

    it('insert to become head', function () {
      this.list.append(this.b);
      this.list.insertBefore(this.a, this.b);
      expect(this.list.length).toBe(2);
      expect(this.list.head).toBe(this.a);
      expect(this.list.tail).toBe(this.b);
      expect(this.a.prev).toBeNull();
      expect(this.a.next).toBe(this.b);
      expect(this.b.prev).toBe(this.a);
      expect(this.b.next).toBeNull();
    });

    it('insert to become tail', function () {
      this.list.append(this.a);
      this.list.insertBefore(this.b, null);
      expect(this.list.length).toBe(2);
      expect(this.list.head).toBe(this.a);
      expect(this.list.tail).toBe(this.b);
      expect(this.a.prev).toBeNull();
      expect(this.a.next).toBe(this.b);
      expect(this.b.prev).toBe(this.a);
      expect(this.b.next).toBeNull();
    });

    it('insert in middle', function () {
      this.list.append(this.a, this.c);
      this.list.insertBefore(this.b, this.c);
      expect(this.list.length).toBe(3);
      expect(this.list.head).toBe(this.a);
      expect(this.a.next).toBe(this.b);
      expect(this.b.next).toBe(this.c);
      expect(this.list.tail).toBe(this.c);
    });

    it('remove head', function () {
      this.list.append(this.a, this.b);
      this.list.remove(this.a);
      expect(this.list.length).toBe(1);
      expect(this.list.head).toBe(this.b);
      expect(this.list.tail).toBe(this.b);
      expect(this.list.head.prev).toBeNull();
      expect(this.list.tail.next).toBeNull();
    });

    it('remove tail', function () {
      this.list.append(this.a, this.b);
      this.list.remove(this.b);
      expect(this.list.length).toBe(1);
      expect(this.list.head).toBe(this.a);
      expect(this.list.tail).toBe(this.a);
      expect(this.list.head.prev).toBeNull();
      expect(this.list.tail.next).toBeNull();
    });

    it('remove inner', function () {
      this.list.append(this.a, this.b, this.c);
      this.list.remove(this.b);
      expect(this.list.length).toBe(2);
      expect(this.list.head).toBe(this.a);
      expect(this.list.tail).toBe(this.c);
      expect(this.list.head.prev).toBeNull();
      expect(this.list.tail.next).toBeNull();
      expect(this.a.next).toBe(this.c);
      expect(this.c.prev).toBe(this.a);
      // Maintain references
      expect(this.b.prev).toBe(this.a);
      expect(this.b.next).toBe(this.c);
    });

    it('remove only node', function () {
      this.list.append(this.a);
      this.list.remove(this.a);
      expect(this.list.length).toBe(0);
      expect(this.list.head).toBeNull();
      expect(this.list.tail).toBeNull();
    });

    it('contains', function () {
      this.list.append(this.a, this.b);
      expect(this.list.contains(this.a)).toBe(true);
      expect(this.list.contains(this.b)).toBe(true);
      expect(this.list.contains(this.c)).toBe(false);
    });

    it('move', function () {
      this.list.append(this.a, this.b, this.c);
      this.list.remove(this.b);
      this.list.remove(this.a);
      this.list.remove(this.c);
      this.list.append(this.b);
      expect(this.b.prev).toBeNull();
      expect(this.b.next).toBeNull();
    });
  });

  describe('iteration', function () {
    beforeEach(function () {
      this.spy = {
        callback: function () {
          return arguments;
        },
      };
      spyOn(this.spy, 'callback');
    });

    it('iterate over empty list', function () {
      this.list.forEach(this.spy.callback);
      expect(this.spy.callback.calls.count()).toBe(0);
    });

    it('iterate non-head start', function () {
      this.list.append(this.a, this.b, this.c);
      let next = this.list.iterator(this.b);
      let b = next();
      let c = next();
      let d = next();
      expect(b).toBe(this.b);
      expect(c).toBe(this.c);
      expect(d).toBeNull();
    });

    it('find', function () {
      this.list.append(this.a, this.b, this.zero, this.c);
      expect(this.list.find(0)).toEqual([this.a, 0]);
      expect(this.list.find(2)).toEqual([this.a, 2]);
      expect(this.list.find(6)).toEqual([this.c, 0]);
      expect(this.list.find(3, true)).toEqual([this.a, 3]);
      expect(this.list.find(6, true)).toEqual([this.zero, 0]);
      expect(this.list.find(3)).toEqual([this.b, 0]);
      expect(this.list.find(4)).toEqual([this.b, 1]);
      expect(this.list.find(10)).toEqual([null, 0]);
    });

    it('offset', function () {
      this.list.append(this.a, this.b, this.c);
      expect(this.list.offset(this.a)).toBe(0);
      expect(this.list.offset(this.b)).toBe(3);
      expect(this.list.offset(this.c)).toBe(6);
      expect(this.list.offset({})).toBe(-1);
    });

    it('forEach', function () {
      this.list.append(this.a, this.b, this.c);
      this.list.forEach(this.spy.callback);
      expect(this.spy.callback.calls.count()).toBe(3);
      let result = this.spy.callback.calls.all().reduce(function (memo, call) {
        return memo + call.args[0].str;
      }, '');
      expect(result).toBe('abc');
    });

    it('destructive modification', function () {
      this.list.append(this.a, this.b, this.c);
      let arr = [];
      this.list.forEach((node) => {
        arr.push(node.str);
        if (node === this.a) {
          this.list.remove(this.a);
          this.list.remove(this.b);
          this.list.append(this.a);
        }
      });
      expect(arr).toEqual(['a', 'b', 'c', 'a']);
    });

    it('map', function () {
      this.list.append(this.a, this.b, this.c);
      let arr = this.list.map(function (node) {
        return node.str;
      });
      expect(arr).toEqual(['a', 'b', 'c']);
    });

    it('reduce', function () {
      this.list.append(this.a, this.b, this.c);
      let memo = this.list.reduce(function (memo, node) {
        return memo + node.str;
      }, '');
      expect(memo).toBe('abc');
    });

    it('forEachAt', function () {
      this.list.append(this.a, this.b, this.c);
      this.list.forEachAt(3, 3, this.spy.callback);
      expect(this.spy.callback.calls.count()).toBe(2);
      expect(this.spy.callback.calls.first().args).toEqual([this.a, 3, 0]);
    });

    it('forEachAt zero length nodes', function () {
      this.list.append(this.a, this.zero, this.c);
      this.list.forEachAt(2, 2, this.spy.callback);
      expect(this.spy.callback.calls.count()).toBe(3);
      let calls = this.spy.callback.calls.all();
      expect(calls[0].args).toEqual([this.a, 2, 1]);
      expect(calls[1].args).toEqual([this.zero, 0, 0]);
      expect(calls[2].args).toEqual([this.c, 0, 1]);
    });

    it('forEachAt none', function () {
      this.list.append(this.a, this.b);
      this.list.forEachAt(1, 0, this.spy.callback);
      expect(this.spy.callback.calls.count()).toBe(0);
    });

    it('forEachAt partial nodes', function () {
      this.list.append(this.a, this.b, this.c);
      this.list.forEachAt(1, 7, this.spy.callback);
      expect(this.spy.callback.calls.count()).toBe(3);
      let calls = this.spy.callback.calls.all();
      expect(calls[0].args).toEqual([this.a, 1, 2]);
      expect(calls[1].args).toEqual([this.b, 0, 3]);
      expect(calls[2].args).toEqual([this.c, 0, 2]);
    });

    it('forEachAt at part of single node', function () {
      this.list.append(this.a, this.b, this.c);
      this.list.forEachAt(4, 1, this.spy.callback);
      expect(this.spy.callback.calls.count()).toBe(1);
      expect(this.spy.callback.calls.first().args).toEqual([this.b, 1, 1]);
    });
  });
});
