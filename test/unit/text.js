'use strict';

describe('TextBlot', function() {
  it('constructor(node)', function() {
    let node = document.createTextNode('Test');
    let blot = new TextBlot(node);
    expect(blot.text).toEqual('Test');
    expect(blot.domNode.data).toEqual('Test');
  });

  it('deleteAt() partial', function() {
    let blot = Registry.create('text', 'Test');
    blot.deleteAt(1, 2);
    expect(blot.value()).toEqual('Tt');
    expect(blot.length()).toEqual(2);
  });

  it('deleteAt() all', function() {
    let container = Registry.create('inline');
    let textBlot = Registry.create('text', 'Test');
    container.appendChild(textBlot);
    expect(container.domNode.firstChild).toEqual(textBlot.domNode);
    textBlot.deleteAt(0, 4);
    expect(textBlot.domNode.data).toEqual('');
  });

  it('insertAt() text', function() {
    let textBlot = Registry.create('text', 'Test');
    textBlot.insertAt(1, 'ough');
    expect(textBlot.value()).toEqual('Toughest');
  });

  it('insertAt() other', function() {
    let container = Registry.create('inline');
    let textBlot = Registry.create('text', 'Test');
    container.appendChild(textBlot);
    textBlot.insertAt(2, 'image', {});
    expect(textBlot.value()).toEqual('Te');
    expect(textBlot.next.statics.blotName).toEqual('image');
    expect(textBlot.next.next.value()).toEqual('st');
  });

  it('split() middle', function() {
    let container = Registry.create('inline');
    let textBlot = Registry.create('text', 'Test');
    container.appendChild(textBlot);
    let after = textBlot.split(2);
    expect(textBlot.value()).toEqual('Te');
    expect(after.value()).toEqual('st');
    expect(textBlot.next).toEqual(after);
    expect(after.prev).toEqual(textBlot);
  });

  it('split() noop', function() {
    let container = Registry.create('inline');
    let textBlot = Registry.create('text', 'Test');
    container.appendChild(textBlot);
    let before = textBlot.split(0);
    let after = textBlot.split(4);
    let invalid = textBlot.split(5);
    expect(before).toEqual(textBlot);
    expect(after).toBe(null);
    expect(invalid).toBe(null);
  });

  it('split() force', function() {
    let container = Registry.create('inline');
    let textBlot = Registry.create('text', 'Test');
    container.appendChild(textBlot);
    let after = textBlot.split(4, true);
    expect(after).not.toEqual(textBlot);
    expect(after.value()).toEqual('');
    expect(textBlot.next).toEqual(after);
    expect(after.prev).toEqual(textBlot);
  });

  it('format wrap', function() {
    let container = Registry.create('inline');
    let textBlot = Registry.create('text', 'Test');
    container.appendChild(textBlot);
    textBlot.formatAt(0, 4, 'bold', true);
    expect(textBlot.domNode.parentNode.tagName).toEqual('STRONG');
    expect(textBlot.value()).toEqual('Test');
  });

  it('format null', function() {
    let container = Registry.create('inline');
    let textBlot = Registry.create('text', 'Test');
    container.appendChild(textBlot);
    textBlot.formatAt(0, 4, 'bold', null);
    expect(textBlot.domNode.parentNode.tagName).toEqual('SPAN');
    expect(textBlot.value()).toEqual('Test');
  });

  it('format split', function() {
    let container = Registry.create('block');
    let textBlot = Registry.create('text', 'Test');
    container.appendChild(textBlot);
    textBlot.formatAt(1, 2, 'bold', true);
    expect(container.domNode.innerHTML).toEqual('T<strong>es</strong>t');
    expect(textBlot.next.statics.blotName).toEqual('bold');
    expect(textBlot.value()).toEqual('T');
  });

  it('index()', function() {
    let textBlot = Registry.create('text', 'Test');
    expect(textBlot.index(textBlot.domNode, 2)).toEqual(2);
    expect(textBlot.index(document.body, 2)).toEqual(-1);
  });

  it('position()', function() {
    let textBlot = Registry.create('text', 'Test');
    let [node, offset] = textBlot.position(2);
    expect(node).toEqual(textBlot.domNode);
    expect(offset).toEqual(2);
  });
});
