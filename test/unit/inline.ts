import { setupContextBeforeEach } from '../setup';

describe('InlineBlot', function () {
  const ctx = setupContextBeforeEach();

  it('format addition', function () {
    let italicBlot = ctx.scroll.create('italic');
    italicBlot.appendChild(ctx.scroll.create('text', 'Test'));
    italicBlot.formatAt(1, 2, 'bold', true);
    expect(italicBlot.domNode.outerHTML).toEqual(
      '<em>T<strong>es</strong>t</em>',
    );
  });

  it('format invalid', function () {
    let boldBlot = ctx.scroll.create('bold');
    boldBlot.appendChild(ctx.scroll.create('text', 'Test'));
    let original = boldBlot.domNode.outerHTML;
    expect(function () {
      boldBlot.format('nonexistent', true);
    }).not.toThrowError(/\[Parchment\]/);
    expect(boldBlot.domNode.outerHTML).toEqual(original);
  });

  it('format existing', function () {
    let italicBlot = ctx.scroll.create('italic');
    let boldBlot = ctx.scroll.create('bold');
    boldBlot.appendChild(ctx.scroll.create('text', 'Test'));
    italicBlot.appendChild(boldBlot);
    let original = italicBlot.domNode.outerHTML;
    expect(function () {
      boldBlot.formatAt(0, 4, 'bold', true);
      italicBlot.formatAt(0, 4, 'italic', true);
    }).not.toThrowError(/\[Parchment\]/);
    expect(italicBlot.domNode.outerHTML).toEqual(original);
  });

  it('format removal nonexistent', function () {
    let container = ctx.scroll.create('block');
    let italicBlot = ctx.scroll.create('italic');
    italicBlot.appendChild(ctx.scroll.create('text', 'Test'));
    container.appendChild(italicBlot);
    let original = italicBlot.domNode.outerHTML;
    expect(function () {
      italicBlot.format('bold', false);
    }).not.toThrowError(/\[Parchment\]/);
    expect(italicBlot.domNode.outerHTML).toEqual(original);
  });

  it('delete + unwrap', function () {
    let node = document.createElement('p');
    node.innerHTML = '<em><strong>Test</strong></em>!';
    let container = ctx.scroll.create(node);
    container.deleteAt(0, 4);
    expect(container.children.head.value()).toEqual('!');
  });

  it('formats()', function () {
    let italic = document.createElement('em');
    italic.style.color = 'red';
    italic.innerHTML = '<strong>Test</strong>!';
    let blot = ctx.scroll.create(italic);
    expect(blot.formats()).toEqual({ italic: true, color: 'red' });
  });

  it('change', function () {
    let container = ctx.scroll.create('block');
    let script = ctx.scroll.create('script', 'sup');
    container.appendChild(script);
    script.format('script', 'sub');
    expect(container.domNode.innerHTML).toEqual('<sub></sub>');
    expect(container.children.head.formats()).toEqual({ script: 'sub' });
  });
});
