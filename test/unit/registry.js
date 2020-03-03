'use strict';

describe('TestRegistry', function() {
  describe('create()', function() {
    it('name', function() {
      let blot = TestRegistry.create(this.scroll, 'bold');
      expect(blot instanceof BoldBlot).toBe(true);
      expect(blot.statics.blotName).toBe('bold');
    });

    it('node', function() {
      let node = document.createElement('strong');
      let blot = TestRegistry.create(this.scroll, node);
      expect(blot instanceof BoldBlot).toBe(true);
      expect(blot.statics.blotName).toBe('bold');
    });

    it('node in iframe', function() {
      const testIFrame = setupTestContainer();
      let node = document.createElement('strong');
      testIFrame.contentDocument.body.appendChild(node);
      let blot = TestRegistry.create(this.scroll, node);

      expect(blot instanceof BoldBlot).toBe(true);
      expect(blot.statics.blotName).toBe('bold');
      expect(blot.domNode).toBe(node);

      document.body.removeChild(testIFrame);
    });

    it('block', function() {
      let blot = TestRegistry.create(this.scroll, Scope.BLOCK_BLOT);
      expect(blot instanceof BlockBlot).toBe(true);
      expect(blot.statics.blotName).toBe('block');
    });

    it('inline', function() {
      let blot = TestRegistry.create(this.scroll, Scope.INLINE_BLOT);
      expect(blot instanceof InlineBlot).toBe(true);
      expect(blot.statics.blotName).toBe('inline');
    });

    it('string index', function() {
      let blot = TestRegistry.create(this.scroll, 'header', '2');
      expect(blot instanceof HeaderBlot).toBe(true);
      expect(blot.formats()).toEqual({ header: 'h2' });
    });

    it('invalid', function() {
      expect(() => {
        TestRegistry.create(this.scroll, BoldBlot);
      }).toThrowError(/\[Parchment\]/);
    });
  });

  describe('register()', function() {
    it('invalid', function() {
      expect(function() {
        TestRegistry.register({});
      }).toThrowError(/\[Parchment\]/);
    });

    it('abstract', function() {
      expect(function() {
        TestRegistry.register(ShadowBlot);
      }).toThrowError(/\[Parchment\]/);
    });
  });

  describe('find()', function() {
    it('exact', function() {
      let blockNode = document.createElement('p');
      blockNode.innerHTML = '<span>01</span><em>23<strong>45</strong></em>';
      let blockBlot = TestRegistry.create(this.scroll, blockNode);
      expect(TestRegistry.find(document.body)).toBeFalsy();
      expect(TestRegistry.find(blockNode)).toBe(blockBlot);
      expect(TestRegistry.find(blockNode.querySelector('span'))).toBe(
        blockBlot.children.head,
      );
      expect(TestRegistry.find(blockNode.querySelector('em'))).toBe(
        blockBlot.children.tail,
      );
      expect(TestRegistry.find(blockNode.querySelector('strong'))).toBe(
        blockBlot.children.tail.children.tail,
      );
      let text01 = blockBlot.children.head.children.head;
      let text23 = blockBlot.children.tail.children.head;
      let text45 = blockBlot.children.tail.children.tail.children.head;
      expect(TestRegistry.find(text01.domNode)).toBe(text01);
      expect(TestRegistry.find(text23.domNode)).toBe(text23);
      expect(TestRegistry.find(text45.domNode)).toBe(text45);
    });

    it('bubble', function() {
      let blockBlot = TestRegistry.create(this.scroll, 'block');
      let textNode = document.createTextNode('Test');
      blockBlot.domNode.appendChild(textNode);
      expect(TestRegistry.find(textNode)).toBeFalsy();
      expect(TestRegistry.find(textNode, true)).toEqual(blockBlot);
    });

    it('detached parent', function() {
      let blockNode = document.createElement('p');
      blockNode.appendChild(document.createTextNode('Test'));
      expect(TestRegistry.find(blockNode.firstChild)).toBeFalsy();
      expect(TestRegistry.find(blockNode.firstChild, true)).toBeFalsy();
    });
  });

  describe('query()', function() {
    it('class', function() {
      let node = document.createElement('em');
      node.setAttribute('class', 'author-blot');
      expect(TestRegistry.query(node)).toBe(AuthorBlot);
    });

    it('class in iFrame', function() {
      const testIFrame = setupTestContainer();
      let node = document.createElement('em');
      node.setAttribute('class', 'author-blot');
      testIFrame.contentDocument.body.appendChild(node);

      expect(TestRegistry.query(node)).toBe(AuthorBlot);

      document.body.removeChild(testIFrame);
    });

    it('type mismatch', function() {
      let match = TestRegistry.query('italic', Scope.ATTRIBUTE);
      expect(match).toBeFalsy();
    });

    it('level mismatch for blot', function() {
      let match = TestRegistry.query('italic', Scope.BLOCK);
      expect(match).toBeFalsy();
    });

    it('level mismatch for attribute', function() {
      let match = TestRegistry.query('color', Scope.BLOCK);
      expect(match).toBeFalsy();
    });

    it('either level', function() {
      let match = TestRegistry.query('italic', Scope.BLOCK | Scope.INLINE);
      expect(match).toBe(ItalicBlot);
    });

    it('level and type match', function() {
      let match = TestRegistry.query('italic', Scope.INLINE & Scope.BLOT);
      expect(match).toBe(ItalicBlot);
    });

    it('level match and type mismatch', function() {
      let match = TestRegistry.query('italic', Scope.INLINE & Scope.ATTRIBUTE);
      expect(match).toBeFalsy();
    });

    it('type match and level mismatch', function() {
      let match = TestRegistry.query('italic', Scope.BLOCK & Scope.BLOT);
      expect(match).toBeFalsy();
    });
  });
});

function setupTestContainer() {
  const testFrame = document.createElement('iframe');
  testFrame.setAttribute('width', 800);
  testFrame.setAttribute('height', 1000);
  testFrame.setAttribute('frameborder', 0);
  document.body.appendChild(testFrame);
  testFrame.contentWindow.document.open();
  testFrame.contentWindow.document.write(
    `<!DOCTYPE html>\n<html><head></head><body></body></html>`,
  );
  testFrame.contentWindow.document.close();
  return testFrame;
}
