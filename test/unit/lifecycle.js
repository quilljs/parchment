'use strict';

describe('Lifecycle', function () {
  describe('create()', function () {
    it('specific tagName', function () {
      let node = BoldBlot.create();
      expect(node).toBeTruthy();
      expect(node.tagName).toEqual(BoldBlot.tagName.toUpperCase());
    });

    it('array tagName index', function () {
      let node = HeaderBlot.create(2);
      expect(node).toBeTruthy();
      let blot = this.scroll.create(node);
      expect(blot.formats()).toEqual({ header: 'h2' });
    });

    it('array tagName value', function () {
      let node = HeaderBlot.create('h2');
      expect(node).toBeTruthy();
      let blot = this.scroll.create(node);
      expect(blot.formats()).toEqual({ header: 'h2' });
    });

    it('array tagName default', function () {
      let node = HeaderBlot.create();
      expect(node).toBeTruthy();
      let blot = this.scroll.create(node);
      expect(blot.formats()).toEqual({ header: 'h1' });
    });

    it('null tagName', function () {
      class NullBlot extends ShadowBlot {}
      expect(NullBlot.create.bind(NullBlot)).toThrowError(/\[Parchment\]/);
    });

    it('className', function () {
      class ClassBlot extends ShadowBlot {}
      ClassBlot.className = 'test';
      ClassBlot.tagName = 'span';
      let node = ClassBlot.create();
      expect(node).toBeTruthy();
      expect(node.classList.contains('test')).toBe(true);
      expect(node.tagName).toBe('SPAN');
    });
  });

  describe('optimize()', function () {
    it('unwrap empty inline', function () {
      let node = document.createElement('p');
      node.innerHTML =
        '<span style="color: red;"><strong>Te</strong><em>st</em></span>';
      let block = this.scroll.create(node);
      this.scroll.appendChild(block);
      let span = this.scroll.find(node.querySelector('span'));
      span.format('color', false);
      this.scroll.optimize();
      expect(this.container.innerHTML).toEqual(
        '<p><strong>Te</strong><em>st</em></p>',
      );
    });

    it('keep formats empty text', function () {
      let node = document.createElement('p');
      node.innerHTML = '<em><strong>Test</strong></em>';
      let block = this.scroll.create(node);
      this.scroll.appendChild(block);
      let text = this.scroll.find(node.querySelector('strong').firstChild);
      text.deleteAt(0, 4);
      this.scroll.optimize();
      expect(this.container.innerHTML).toEqual('<p><em><strong></strong></em></p>');
    });

    it('format merge', function () {
      let node = document.createElement('p');
      node.innerHTML = '<strong>T</strong>es<strong>t</strong>';
      let block = this.scroll.create(node);
      this.scroll.appendChild(block);
      let text = this.scroll.find(node.childNodes[1]);
      text.formatAt(0, 2, 'bold', true);
      this.scroll.optimize();
      expect(this.container.innerHTML).toEqual('<p><strong>Test</strong></p>');
      expect(this.container.querySelector('strong').childNodes.length).toBe(1);
    });

    it('format recursive merge', function () {
      let node = document.createElement('p');
      node.innerHTML =
        '<em><strong>T</strong></em><strong>es</strong><em><strong>t</strong></em>';
      let block = this.scroll.create(node);
      this.scroll.appendChild(block);
      let target = this.scroll.find(node.childNodes[1]);
      target.wrap('italic', true);
      this.scroll.optimize();
      expect(this.container.innerHTML).toEqual(
        '<p><em><strong>Test</strong></em></p>',
      );
      expect(this.container.querySelector('strong').childNodes.length).toBe(1);
    });

    it('remove format merge', function () {
      let node = document.createElement('p');
      node.innerHTML =
        '<strong>T</strong><em><strong>es</strong></em><strong>t</strong>';
      let block = this.scroll.create(node);
      this.scroll.appendChild(block);
      block.formatAt(1, 2, 'italic', false);
      this.scroll.optimize();
      expect(this.container.innerHTML).toEqual('<p><strong>Test</strong></p>');
      expect(this.container.querySelector('strong').childNodes.length).toBe(1);
    });

    it('remove attribute merge', function () {
      let node = document.createElement('p');
      node.innerHTML = '<em>T</em><em style="color: red;">es</em><em>t</em>';
      let block = this.scroll.create(node);
      this.scroll.appendChild(block);
      block.formatAt(1, 2, 'color', false);
      this.scroll.optimize();
      expect(this.container.innerHTML).toEqual('<p><em>Test</em></p>');
      expect(this.container.querySelector('em').childNodes.length).toBe(1);
    });

    it('format no merge attribute mismatch', function () {
      let node = document.createElement('p');
      node.innerHTML =
        '<strong>Te</strong><em><strong style="color: red;">st</strong></em>';
      let block = this.scroll.create(node);
      this.scroll.appendChild(block);
      block.formatAt(2, 2, 'italic', false);
      this.scroll.optimize();
      expect(this.container.innerHTML).toEqual(
        '<p><strong>Te</strong><strong style="color: red;">st</strong></p>',
      );
    });

    it('delete + merge', function () {
      let node = document.createElement('p');
      node.innerHTML = '<em>T</em>es<em>t</em>';
      let block = this.scroll.create(node);
      this.scroll.appendChild(block);
      block.deleteAt(1, 2);
      this.scroll.optimize();
      expect(this.container.innerHTML).toEqual('<p><em>Tt</em></p>');
      expect(this.container.querySelector('em').childNodes.length).toBe(1);
    });

    it('unwrap + recursive merge', function () {
      let node = document.createElement('p');
      node.innerHTML =
        '<strong>T</strong><em style="color: red;"><strong>es</strong></em><strong>t</strong>';
      let block = this.scroll.create(node);
      this.scroll.appendChild(block);
      block.formatAt(1, 2, 'italic', false);
      block.formatAt(1, 2, 'color', false);
      this.scroll.optimize();
      expect(this.container.innerHTML).toEqual('<p><strong>Test</strong></p>');
      expect(this.container.querySelector('strong').childNodes.length).toBe(1);
    });

    // NOTE: This test case is removed because this case is handled by quilljs / quill
    // it('remove text + recursive merge', function () {
    //   let node = document.createElement('p');
    //   node.innerHTML = '<em>Te</em>|<em>st</em>';
    //   let block = this.scroll.create(node);
    //   this.scroll.appendChild(block);
    //   node.childNodes[1].data = '';
    //   debugger;
    //   this.scroll.optimize();
    //   expect(this.container.innerHTML).toEqual('<p><em>Test</em></p>');
    //   expect(this.container.firstChild.firstChild.childNodes.length).toBe(1);
    // });

    it('insert default child', function () {
      HeaderBlot.defaultChild = ImageBlot;
      let blot = this.scroll.create('header');
      expect(blot.domNode.innerHTML).toEqual('');
      blot.optimize();
      HeaderBlot.defaultChild = undefined;
      expect(blot.domNode.outerHTML).toEqual('<h1><img></h1>');
    });
  });

  describe('update()', function () {
    beforeEach(function () {
      this.container.innerHTML =
        '<p><em style="color: red;"><strong>Test</strong><img>ing</em></p><p><em>!</em></p>';
      this.scroll.update();
      // [p, em, strong, text, image, text, p, em, text]
      this.descendants = this.scroll.descendants(ShadowBlot);
      this.descendants.forEach(function (blot) {
        spyOn(blot, 'update').and.callThrough();
      });
      this.checkUpdateCalls = (called) => {
        this.descendants.forEach(function (blot) {
          if (
            called === blot ||
            (Array.isArray(called) && called.indexOf(blot) > -1)
          ) {
            expect(blot.update).toHaveBeenCalled();
          } else {
            expect(blot.update).not.toHaveBeenCalled();
          }
        });
      };
      this.checkValues = (expected) => {
        let values = this.scroll.descendants(LeafBlot).map(function (leaf) {
          return leaf.value();
        });
        expect(values).toEqual(expected);
      };
    });

    describe('api', function () {
      it('insert text', function () {
        this.scroll.insertAt(2, '|');
        this.scroll.optimize();
        this.checkValues(['Te|st', { image: true }, 'ing', '!']);
        expect(this.scroll.observer.takeRecords()).toEqual([]);
      });

      it('insert embed', function () {
        this.scroll.insertAt(2, 'image', true);
        this.scroll.optimize();
        this.checkValues([
          'Te',
          { image: true },
          'st',
          { image: true },
          'ing',
          '!',
        ]);
        expect(this.scroll.observer.takeRecords()).toEqual([]);
      });

      it('delete', function () {
        this.scroll.deleteAt(2, 5);
        this.scroll.optimize();
        this.checkValues(['Te', 'g', '!']);
        expect(this.scroll.observer.takeRecords()).toEqual([]);
      });

      it('format', function () {
        this.scroll.formatAt(2, 5, 'size', '24px');
        this.scroll.optimize();
        this.checkValues(['Te', 'st', { image: true }, 'in', 'g', '!']);
        expect(this.scroll.observer.takeRecords()).toEqual([]);
      });
    });

    describe('dom', function () {
      it('change text', function () {
        let textBlot = this.descendants[3];
        textBlot.domNode.data = 'Te|st';
        this.scroll.update();
        this.checkUpdateCalls(textBlot);
        expect(textBlot.value()).toEqual('Te|st');
      });

      it('add/remove unknown element', function () {
        let unknownElement = document.createElement('unknownElement');
        let unknownElement2 = document.createElement('unknownElement2');
        this.scroll.domNode.appendChild(unknownElement);
        unknownElement.appendChild(unknownElement2);
        this.scroll.domNode.removeChild(unknownElement);
        this.scroll.update();
        this.checkValues(['Test', { image: true }, 'ing', '!']);
      });

      it('add attribute', function () {
        let attrBlot = this.descendants[1];
        attrBlot.domNode.setAttribute('id', 'blot');
        this.scroll.update();
        this.checkUpdateCalls(attrBlot);
        expect(attrBlot.formats()).toEqual({
          color: 'red',
          italic: true,
          id: 'blot',
        });
      });

      it('add embed attribute', function () {
        let imageBlot = this.descendants[4];
        imageBlot.domNode.setAttribute('alt', 'image');
        this.scroll.update();
        this.checkUpdateCalls(imageBlot);
      });

      it('change attributes', function () {
        let attrBlot = this.descendants[1];
        attrBlot.domNode.style.color = 'blue';
        this.scroll.update();
        this.checkUpdateCalls(attrBlot);
        expect(attrBlot.formats()).toEqual({ color: 'blue', italic: true });
      });

      it('remove attribute', function () {
        let attrBlot = this.descendants[1];
        attrBlot.domNode.removeAttribute('style');
        this.scroll.update();
        this.checkUpdateCalls(attrBlot);
        expect(attrBlot.formats()).toEqual({ italic: true });
      });

      it('add child node', function () {
        let italicBlot = this.descendants[1];
        italicBlot.domNode.appendChild(document.createTextNode('|'));
        this.scroll.update();
        this.checkUpdateCalls(italicBlot);
        this.checkValues(['Test', { image: true }, 'ing|', '!']);
      });

      it('add empty family', function () {
        let blockBlot = this.descendants[0];
        let boldNode = document.createElement('strong');
        let html = this.scroll.innerHTML;
        boldNode.appendChild(document.createTextNode(''));
        blockBlot.domNode.appendChild(boldNode);
        this.scroll.update();
        this.checkUpdateCalls(blockBlot);
        expect(this.scroll.innerHTML).toBe(html);
        expect(this.scroll.descendants(ShadowBlot).length).toEqual(
          this.descendants.length,
        );
      });

      it('move node up', function () {
        let imageBlot = this.descendants[4];
        imageBlot.domNode.parentNode.insertBefore(
          imageBlot.domNode,
          imageBlot.domNode.previousSibling,
        );
        this.scroll.update();
        this.checkUpdateCalls(imageBlot.parent);
        this.checkValues([{ image: true }, 'Test', 'ing', '!']);
      });

      it('move node down', function () {
        let imageBlot = this.descendants[4];
        imageBlot.domNode.parentNode.insertBefore(
          imageBlot.domNode.nextSibling,
          imageBlot.domNode,
        );
        this.scroll.update();
        this.checkUpdateCalls(imageBlot.parent);
        this.checkValues(['Test', 'ing', { image: true }, '!']);
      });

      it('move node and change', function () {
        let firstBlockBlot = this.descendants[0];
        let lastItalicBlot = this.descendants[7];
        firstBlockBlot.domNode.appendChild(lastItalicBlot.domNode);
        lastItalicBlot.domNode.innerHTML = '?';
        this.scroll.update();
        this.checkUpdateCalls([
          firstBlockBlot,
          this.descendants[6],
          this.descendants[7],
        ]);
        this.checkValues(['Test', { image: true }, 'ing', '?']);
      });

      it('add and remove consecutive nodes', function () {
        let italicBlot = this.descendants[1];
        let imageNode = document.createElement('img');
        let textNode = document.createTextNode('|');
        let refNode = italicBlot.domNode.childNodes[1]; // Old img
        italicBlot.domNode.insertBefore(textNode, refNode);
        italicBlot.domNode.insertBefore(imageNode, textNode);
        italicBlot.domNode.removeChild(refNode);
        this.scroll.update();
        this.checkUpdateCalls(italicBlot);
        this.checkValues(['Test', { image: true }, '|ing', '!']);
      });

      it('wrap text', function () {
        let textNode = this.descendants[5].domNode;
        let spanNode = document.createElement('span');
        textNode.parentNode.removeChild(textNode);
        this.scroll.domNode.lastChild.appendChild(spanNode);
        spanNode.appendChild(textNode);
        this.scroll.update();
        this.checkValues(['Test', { image: true }, '!', 'ing']);
      });

      it('add then remove same node', function () {
        let italicBlot = this.descendants[1];
        let textNode = document.createTextNode('|');
        italicBlot.domNode.appendChild(textNode);
        italicBlot.domNode.removeChild(textNode);
        this.scroll.update();
        this.checkUpdateCalls(italicBlot);
        this.checkValues(['Test', { image: true }, 'ing', '!']);
      });

      it('remove child node', function () {
        let imageBlot = this.descendants[4];
        imageBlot.domNode.parentNode.removeChild(imageBlot.domNode);
        this.scroll.update();
        this.checkUpdateCalls(this.descendants[1]);
        this.checkValues(['Test', 'ing', '!']);
      });

      it('change and remove node', function () {
        let italicBlot = this.descendants[1];
        italicBlot.domNode.color = 'blue';
        italicBlot.domNode.parentNode.removeChild(italicBlot.domNode);
        this.scroll.update();
        this.checkUpdateCalls(italicBlot.parent);
        this.checkValues(['!']);
      });

      it('change and remove parent', function () {
        let blockBlot = this.descendants[0];
        let italicBlot = this.descendants[1];
        italicBlot.domNode.color = 'blue';
        this.scroll.domNode.removeChild(blockBlot.domNode);
        this.scroll.update();
        this.checkUpdateCalls([]);
        this.checkValues(['!']);
      });

      it('different changes to same blot', function () {
        let attrBlot = this.descendants[1];
        attrBlot.domNode.style.color = 'blue';
        attrBlot.domNode.insertBefore(
          document.createTextNode('|'),
          attrBlot.domNode.childNodes[1],
        );
        this.scroll.update();
        this.checkUpdateCalls(attrBlot);
        expect(attrBlot.formats()).toEqual({ color: 'blue', italic: true });
        this.checkValues(['Test', '|', { image: true }, 'ing', '!']);
      });
    });
  });
});
