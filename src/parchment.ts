import ContainerBlot from './blot/abstract/container';
import ParentBlot from './blot/abstract/parent';
import LeafBlot from './blot/abstract/leaf';

import ScrollBlot from './blot/scroll';
import InlineBlot from './blot/inline';
import BlockBlot from './blot/block';
import EmbedBlot from './blot/embed';
import TextBlot from './blot/text';

import Attributor from './attributor/attributor';
import ClassAttributor from './attributor/class';
import StyleAttributor from './attributor/style';
import AttributorStore from './attributor/store';

import * as Registry from './registry';

let Parchment = {
  Scope: Registry.Scope,

  create: Registry.create,
  find: Registry.find,
  query: Registry.query,
  register: Registry.register,

  Parent: ParentBlot,
  Container: ContainerBlot,
  Leaf: LeafBlot,
  Embed: EmbedBlot,

  Scroll: ScrollBlot,
  Block: BlockBlot,
  Inline: InlineBlot,
  Text: TextBlot,

  Attributor: {
    Attribute: Attributor,
    Class: ClassAttributor,
    Style: StyleAttributor,

    Store: AttributorStore,
  },
};

export default Parchment;
