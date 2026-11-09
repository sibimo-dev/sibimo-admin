import{ct as e,it as t}from"./reactivity.esm-bundler-CZkUCHE_.js";import{$t as n,C as r,Ft as i,Gt as a,It as o,Mt as s,Nt as c,P as l,Pt as u,Qt as d,Rt as f,Y as p,Yt as m,Zt as h,_ as g,_t as _,an as v,bt as y,d as b,dt as x,en as S,h as C,ht as w,kt as T,nt as E,o as D,on as O,pt as k,r as ee,s as te,tn as A,x as j,xt as ne,z as re,zt as M}from"./api-fX1ve9Bk.js";import{n as ie,r as N,t as ae}from"./portal-Bdhb7eQi.js";import{A as oe,I as se,L as ce,N as P,T as F,k as I,z as L}from"./index-DlFNzWUY.js";var R=b.extend({name:`chip`,style:`
    .p-chip {
        display: inline-flex;
        align-items: center;
        background: dt('chip.background');
        color: dt('chip.color');
        border-radius: dt('chip.border.radius');
        padding-block: dt('chip.padding.y');
        padding-inline: dt('chip.padding.x');
        gap: dt('chip.gap');
    }
    
    .p-chip.p-focus {
        background: dt('chip.focus.background');
    }

    .p-chip-icon {
        color: dt('chip.icon.color');
        font-size: dt('chip.icon.size');
        width: dt('chip.icon.size');
        height: dt('chip.icon.size');
        flex-shrink: 0;
    }

    .p-chip-image {
        border-radius: 50%;
        width: dt('chip.image.width');
        height: dt('chip.image.height');
        margin-inline-start: calc(-1 * dt('chip.padding.y'));
        flex-shrink: 0;
    }

    .p-chip-label {
        font-weight: dt('chip.label.font.weight');
        font-size: dt('chip.label.font.size');
    }

    .p-chip:has(.p-chip-remove-icon) {
        padding-inline-end: dt('chip.padding.y');
    }

    .p-chip:has(.p-chip-image) {
        padding-block-start: calc(dt('chip.padding.y') / 2);
        padding-block-end: calc(dt('chip.padding.y') / 2);
    }

    .p-chip-remove-icon {
        cursor: pointer;
        font-size: dt('chip.remove.icon.size');
        width: dt('chip.remove.icon.size');
        height: dt('chip.remove.icon.size');
        color: dt('chip.remove.icon.color');
        border-radius: 50%;
        transition:
            outline-color dt('chip.transition.duration'),
            box-shadow dt('chip.transition.duration');
        outline-color: transparent;
    }

    .p-chip-remove-icon:focus-visible {
        box-shadow: dt('chip.remove.icon.focus.ring.shadow');
        outline: dt('chip.remove.icon.focus.ring.width') dt('chip.remove.icon.focus.ring.style') dt('chip.remove.icon.focus.ring.color');
        outline-offset: dt('chip.remove.icon.focus.ring.offset');
    }
`,classes:{root:`p-chip p-component`,image:`p-chip-image`,icon:`p-chip-icon`,label:`p-chip-label`,removeIcon:`p-chip-remove-icon`}}),z={name:`Chip`,extends:{name:`BaseChip`,extends:D,props:{label:{type:[String,Number],default:null},icon:{type:String,default:null},image:{type:String,default:null},removable:{type:Boolean,default:!1},removeIcon:{type:String,default:void 0}},style:R,provide:function(){return{$pcChip:this,$parentInstance:this}}},inheritAttrs:!1,emits:[`remove`],data:function(){return{visible:!0}},methods:{onKeydown:function(e){(e.key===`Enter`||e.key===`Backspace`)&&this.close(e)},close:function(e){this.visible=!1,this.$emit(`remove`,e)}},computed:{dataP:function(){return C({removable:this.removable})}},components:{TimesCircle:P}},B=[`data-p`],V=[`src`];function H(t,n,r,o,s,l){return s.visible?(m(),i(`div`,a({key:0,class:t.cx(`root`)},t.ptmi(`root`),{"data-p":l.dataP}),[d(t.$slots,`default`,{},function(){return[t.image?(m(),i(`img`,a({key:0,src:t.image},t.ptm(`image`),{class:t.cx(`image`)}),null,16,V)):t.$slots.icon?(m(),c(A(t.$slots.icon),a({key:1,class:t.cx(`icon`)},t.ptm(`icon`)),null,16,[`class`])):t.icon?(m(),i(`span`,a({key:2,class:[t.cx(`icon`),t.icon]},t.ptm(`icon`)),null,16)):u(``,!0),t.label===null?u(``,!0):(m(),i(`div`,a({key:3,class:t.cx(`label`)},t.ptm(`label`)),e(t.label),17))]}),t.removable?d(t.$slots,`removeicon`,{key:0,removeCallback:l.close,keydownCallback:l.onKeydown},function(){return[(m(),c(A(t.removeIcon?`span`:`TimesCircle`),a({class:[t.cx(`removeIcon`),t.removeIcon],tabindex:`0`,onClick:l.close,onKeydown:l.onKeydown},t.ptm(`removeIcon`)),null,16,[`class`,`onClick`,`onKeydown`]))]}):u(``,!0)],16,B)):u(``,!0)}z.render=H;var U=b.extend({name:`autocomplete`,style:`
    .p-autocomplete {
        display: inline-flex;
    }

    .p-autocomplete-loader {
        position: absolute;
        top: 50%;
        margin-top: calc(-1 * dt('icon.size') / 2);
        inset-inline-end: dt('autocomplete.padding.x');
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-loader {
        inset-inline-end: calc(dt('autocomplete.dropdown.width') + dt('autocomplete.padding.x'));
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-input {
        flex: 1 1 auto;
        width: 1%;
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-input,
    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-input-multiple {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
    }

    .p-autocomplete-dropdown {
        cursor: pointer;
        display: inline-flex;
        user-select: none;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        width: dt('autocomplete.dropdown.width');
        border-start-end-radius: dt('autocomplete.dropdown.border.radius');
        border-end-end-radius: dt('autocomplete.dropdown.border.radius');
        background: dt('autocomplete.dropdown.background');
        border: 1px solid dt('autocomplete.dropdown.border.color');
        border-inline-start: 0 none;
        color: dt('autocomplete.dropdown.color');
        transition:
            background dt('autocomplete.transition.duration'),
            color dt('autocomplete.transition.duration'),
            border-color dt('autocomplete.transition.duration'),
            outline-color dt('autocomplete.transition.duration'),
            box-shadow dt('autocomplete.transition.duration');
        outline-color: transparent;
    }

    .p-autocomplete-dropdown:not(:disabled):hover {
        background: dt('autocomplete.dropdown.hover.background');
        border-color: dt('autocomplete.dropdown.hover.border.color');
        color: dt('autocomplete.dropdown.hover.color');
    }

    .p-autocomplete-dropdown:not(:disabled):active {
        background: dt('autocomplete.dropdown.active.background');
        border-color: dt('autocomplete.dropdown.active.border.color');
        color: dt('autocomplete.dropdown.active.color');
    }

    .p-autocomplete-dropdown:focus-visible {
        box-shadow: dt('autocomplete.dropdown.focus.ring.shadow');
        outline: dt('autocomplete.dropdown.focus.ring.width') dt('autocomplete.dropdown.focus.ring.style') dt('autocomplete.dropdown.focus.ring.color');
        outline-offset: dt('autocomplete.dropdown.focus.ring.offset');
    }

    .p-autocomplete-overlay {
        position: absolute;
        top: 0;
        left: 0;
        background: dt('autocomplete.overlay.background');
        color: dt('autocomplete.overlay.color');
        border: 1px solid dt('autocomplete.overlay.border.color');
        border-radius: dt('autocomplete.overlay.border.radius');
        box-shadow: dt('autocomplete.overlay.shadow');
        min-width: 100%;
    }

    .p-autocomplete-list-container {
        overflow: auto;
    }

    .p-autocomplete-list {
        margin: 0;
        list-style-type: none;
        display: flex;
        flex-direction: column;
        gap: dt('autocomplete.list.gap');
        padding: dt('autocomplete.list.padding');
    }

    .p-autocomplete-option {
        font-weight: dt('autocomplete.option.font.weight');
        font-size: dt('autocomplete.option.font.size');
        cursor: pointer;
        white-space: nowrap;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        padding: dt('autocomplete.option.padding');
        border: 0 none;
        color: dt('autocomplete.option.color');
        background: transparent;
        transition:
            background dt('list.option.transition.duration'),
            color dt('list.option.transition.duration'),
            border-color dt('list.option.transition.duration');
        border-radius: dt('autocomplete.option.border.radius');
    }

    .p-autocomplete-option:not(.p-autocomplete-option-selected):not(.p-disabled).p-focus {
        background: dt('autocomplete.option.focus.background');
        color: dt('autocomplete.option.focus.color');
    }

    .p-autocomplete-option:not(.p-autocomplete-option-selected):not(.p-disabled):hover {
        background: dt('autocomplete.option.focus.background');
        color: dt('autocomplete.option.focus.color');
    }

    .p-autocomplete-option-selected {
        background: dt('autocomplete.option.selected.background');
        color: dt('autocomplete.option.selected.color');
    }

    .p-autocomplete-option-selected.p-focus {
        background: dt('autocomplete.option.selected.focus.background');
        color: dt('autocomplete.option.selected.focus.color');
    }

    .p-autocomplete-option-group {
        font-weight: dt('autocomplete.option.group.font.weight');
        font-size: dt('autocomplete.option.group.font.size');
        margin: 0;
        padding: dt('autocomplete.option.group.padding');
        color: dt('autocomplete.option.group.color');
        background: dt('autocomplete.option.group.background');
    }

    .p-autocomplete-input-multiple {
        margin: 0;
        list-style-type: none;
        cursor: text;
        overflow: hidden;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        padding: calc(dt('autocomplete.padding.y') / 2) dt('autocomplete.padding.x');
        gap: calc(dt('autocomplete.padding.y') / 2);
        color: dt('autocomplete.color');
        background: dt('autocomplete.background');
        border: 1px solid dt('autocomplete.border.color');
        border-radius: dt('autocomplete.border.radius');
        width: 100%;
        transition:
            background dt('autocomplete.transition.duration'),
            color dt('autocomplete.transition.duration'),
            border-color dt('autocomplete.transition.duration'),
            outline-color dt('autocomplete.transition.duration'),
            box-shadow dt('autocomplete.transition.duration');
        outline-color: transparent;
        box-shadow: dt('autocomplete.shadow');
    }

    .p-autocomplete-input-multiple.p-disabled {
        opacity: 1;
        background: dt('autocomplete.disabled.background');
        color: dt('autocomplete.disabled.color');
    }

    .p-autocomplete-input-multiple:not(.p-disabled):hover {
        border-color: dt('autocomplete.hover.border.color');
    }

    .p-autocomplete.p-focus .p-autocomplete-input-multiple:not(.p-disabled) {
        border-color: dt('autocomplete.focus.border.color');
        box-shadow: dt('autocomplete.focus.ring.shadow');
        outline: dt('autocomplete.focus.ring.width') dt('autocomplete.focus.ring.style') dt('autocomplete.focus.ring.color');
        outline-offset: dt('autocomplete.focus.ring.offset');
    }

    .p-autocomplete.p-invalid .p-autocomplete-input-multiple {
        border-color: dt('autocomplete.invalid.border.color');
    }

    .p-variant-filled.p-autocomplete-input-multiple {
        background: dt('autocomplete.filled.background');
    }

    .p-autocomplete-input-multiple.p-variant-filled:not(.p-disabled):hover {
        background: dt('autocomplete.filled.hover.background');
    }

    .p-autocomplete.p-focus .p-autocomplete-input-multiple.p-variant-filled:not(.p-disabled) {
        background: dt('autocomplete.filled.focus.background');
    }

    .p-autocomplete-chip.p-chip {
        padding-block-start: calc(dt('autocomplete.padding.y') / 2);
        padding-block-end: calc(dt('autocomplete.padding.y') / 2);
        border-radius: dt('autocomplete.chip.border.radius');
    }

    .p-autocomplete-input-multiple:has(.p-autocomplete-chip) {
        padding-inline-start: calc(dt('autocomplete.padding.y') / 2);
        padding-inline-end: calc(dt('autocomplete.padding.y') / 2);
    }

    .p-autocomplete-chip-item.p-focus .p-autocomplete-chip {
        background: dt('autocomplete.chip.focus.background');
        color: dt('autocomplete.chip.focus.color');
    }

    .p-autocomplete-input-chip {
        flex: 1 1 auto;
        display: inline-flex;
        padding-block-start: calc(dt('autocomplete.padding.y') / 2);
        padding-block-end: calc(dt('autocomplete.padding.y') / 2);
    }

    .p-autocomplete-input-chip input {
        border: 0 none;
        outline: 0 none;
        background: transparent;
        margin: 0;
        padding: 0;
        box-shadow: none;
        border-radius: 0;
        width: 100%;
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
        color: inherit;
    }

    .p-autocomplete-input-chip input::placeholder {
        color: dt('autocomplete.placeholder.color');
    }

    .p-autocomplete.p-invalid .p-autocomplete-input-chip input::placeholder {
        color: dt('autocomplete.invalid.placeholder.color');
    }

    .p-autocomplete-empty-message {
        padding: dt('autocomplete.empty.message.padding');
        font-weight: dt('autocomplete.option.font.weight');
        font-size: dt('autocomplete.option.font.size');
    }

    .p-autocomplete-fluid {
        display: flex;
    }

    .p-autocomplete-fluid:has(.p-autocomplete-dropdown) .p-autocomplete-input {
        width: 1%;
    }

    .p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-dropdown {
        width: dt('autocomplete.dropdown.sm.width');
    }

    .p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-dropdown .p-icon {
        font-size: dt('form.field.sm.font.size');
        width: dt('form.field.sm.font.size');
        height: dt('form.field.sm.font.size');
    }

    .p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-dropdown {
        width: dt('autocomplete.dropdown.lg.width');
    }

    .p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-dropdown .p-icon {
        font-size: dt('form.field.lg.font.size');
        width: dt('form.field.lg.font.size');
        height: dt('form.field.lg.font.size');
    }

    .p-autocomplete-clear-icon {
        position: absolute;
        top: 50%;
        margin-top: calc(-1 * dt('icon.size') / 2);
        cursor: pointer;
        color: dt('form.field.icon.color');
        inset-inline-end: dt('autocomplete.padding.x');
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-clear-icon {
        inset-inline-end: calc(dt('autocomplete.padding.x') + dt('autocomplete.dropdown.width'));
    }

    .p-autocomplete:has(.p-autocomplete-clear-icon) .p-autocomplete-input {
        padding-inline-end: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));
    }

    .p-inputgroup .p-autocomplete-dropdown {
        border-radius: 0;
    }

    .p-inputgroup > .p-autocomplete:last-child:has(.p-autocomplete-dropdown) > .p-autocomplete-input {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
    }

    .p-inputgroup > .p-autocomplete:last-child .p-autocomplete-dropdown {
        border-start-end-radius: dt('autocomplete.dropdown.border.radius');
        border-end-end-radius: dt('autocomplete.dropdown.border.radius');
    }
`,classes:{root:function(e){var t=e.instance;return[`p-autocomplete p-component p-inputwrapper`,{"p-invalid":t.$invalid,"p-focus":t.focused,"p-inputwrapper-filled":t.$filled||w(t.inputValue),"p-inputwrapper-focus":t.focused,"p-autocomplete-open":t.overlayVisible,"p-autocomplete-fluid":t.$fluid}]},pcInputText:`p-autocomplete-input`,inputMultiple:function(e){var t=e.instance,n=e.props;return[`p-autocomplete-input-multiple`,{"p-variant-filled":t.$variant===`filled`,"p-disabled":n.disabled}]},clearIcon:`p-autocomplete-clear-icon`,chipItem:function(e){var t=e.instance,n=e.i;return[`p-autocomplete-chip-item`,{"p-focus":t.focusedMultipleOptionIndex===n}]},pcChip:`p-autocomplete-chip`,chipIcon:`p-autocomplete-chip-icon`,inputChip:`p-autocomplete-input-chip`,loader:`p-autocomplete-loader`,dropdown:`p-autocomplete-dropdown`,overlay:`p-autocomplete-overlay p-component`,listContainer:`p-autocomplete-list-container`,list:`p-autocomplete-list`,optionGroup:`p-autocomplete-option-group`,option:function(e){var t=e.instance,n=e.option,r=e.i,i=e.getItemOptions;return[`p-autocomplete-option`,{"p-autocomplete-option-selected":t.isSelected(n),"p-focus":t.focusedOptionIndex===t.getOptionIndex(r,i),"p-disabled":t.isOptionDisabled(n)}]},emptyMessage:`p-autocomplete-empty-message`},inlineStyles:{root:{position:`relative`}}}),W={name:`BaseAutoComplete`,extends:oe,props:{suggestions:{type:Array,default:null},optionLabel:null,optionDisabled:null,optionGroupLabel:null,optionGroupChildren:null,scrollHeight:{type:String,default:`14rem`},dropdown:{type:Boolean,default:!1},dropdownMode:{type:String,default:`blank`},multiple:{type:Boolean,default:!1},loading:{type:Boolean,default:!1},placeholder:{type:String,default:null},dataKey:{type:String,default:null},minLength:{type:Number,default:1},delay:{type:Number,default:300},appendTo:{type:[String,Object],default:`body`},forceSelection:{type:Boolean,default:!1},completeOnFocus:{type:Boolean,default:!1},showClear:{type:Boolean,default:!1},inputId:{type:String,default:null},inputStyle:{type:Object,default:null},inputClass:{type:[String,Object],default:null},inputProps:{type:null,default:null},panelStyle:{type:Object,default:null},panelClass:{type:[String,Object],default:null},overlayStyle:{type:Object,default:null},overlayClass:{type:[String,Object],default:null},dropdownIcon:{type:String,default:null},dropdownClass:{type:[String,Object],default:null},loader:{type:String,default:null},chipIcon:{type:String,default:null},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},selectOnFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},searchLocale:{type:String,default:void 0},searchMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptySearchMessage:{type:String,default:null},showEmptyMessage:{type:Boolean,default:!0},tabindex:{type:Number,default:0},typeahead:{type:Boolean,default:!0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:U,provide:function(){return{$pcAutoComplete:this,$parentInstance:this}}};function G(e,t,n){return(t=le(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function le(e){var t=ue(e,`string`);return K(t)==`symbol`?t:t+``}function ue(e,t){if(K(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(K(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function K(e){"@babel/helpers - typeof";return K=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},K(e)}function q(e){return me(e)||pe(e)||fe(e)||de()}function de(){throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function fe(e,t){if(e){if(typeof e==`string`)return J(e,t);var n={}.toString.call(e).slice(8,-1);return n===`Object`&&e.constructor&&(n=e.constructor.name),n===`Map`||n===`Set`?Array.from(e):n===`Arguments`||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?J(e,t):void 0}}function pe(e){if(typeof Symbol<`u`&&e[Symbol.iterator]!=null||e[`@@iterator`]!=null)return Array.from(e)}function me(e){if(Array.isArray(e))return J(e)}function J(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,r=Array(t);n<t;n++)r[n]=e[n];return r}var Y={name:`AutoComplete`,extends:W,inheritAttrs:!1,emits:[`change`,`focus`,`blur`,`option-select`,`option-unselect`,`dropdown-click`,`clear`,`complete`,`before-show`,`before-hide`,`show`,`hide`,`keydown`,`paste`],inject:{$pcFluid:{default:null}},outsideClickListener:null,resizeListener:null,scrollHandler:null,overlay:null,virtualScroller:null,searchTimeout:null,dirty:!1,startRangeIndex:-1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,focusedMultipleOptionIndex:-1,overlayVisible:!1,searching:!1}},watch:{suggestions:function(){this.searching&&(this.show(),this.focusedOptionIndex=this.overlayVisible&&this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1,this.searching=!1,!this.showEmptyMessage&&this.visibleOptions.length===0&&this.hide()),this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel()},updated:function(){this.overlayVisible&&this.alignOverlay()},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.scrollHandler&&=(this.scrollHandler.destroy(),null),this.overlay&&=(N.clear(this.overlay),null)},methods:{getOptionIndex:function(e,t){return this.virtualScrollerDisabled?e:t&&t(e).index},getOptionLabel:function(e){return this.optionLabel?k(e,this.optionLabel):e},getOptionValue:function(e){return e},getOptionRenderKey:function(e,t){return(this.dataKey?k(e,this.dataKey):this.getOptionLabel(e))+`_`+t},getPTOptions:function(e,t,n,r){return this.ptm(r,{context:{option:e,index:n,selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(n,t),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.optionDisabled?k(e,this.optionDisabled):!1},isOptionGroup:function(e){return this.optionGroupLabel&&e.optionGroup&&e.group},getOptionGroupLabel:function(e){return k(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return k(e,this.optionGroupChildren)},getAriaPosInset:function(e){var t=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(e){return t.isOptionGroup(e)}).length:e)+1},show:function(e){this.$emit(`before-show`),this.dirty=!0,this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex===-1?this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1:this.focusedOptionIndex,e&&j(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},hide:function(e){var t=this,n=function(){t.$emit(`before-hide`),t.dirty=e,t.overlayVisible=!1,t.clicked=!1,t.focusedOptionIndex=-1,e&&j(t.multiple?t.$refs.focusInput:t.$refs.focusInput?.$el)};setTimeout(function(){n()},0)},onFocus:function(e){this.disabled||(!this.dirty&&this.completeOnFocus&&this.search(e,e.target.value,`focus`),this.dirty=!0,this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex===-1?this.overlayVisible&&this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1:this.focusedOptionIndex,this.scrollInView(this.focusedOptionIndex)),this.$emit(`focus`,e))},onBlur:function(e){var t,n;this.dirty=!1,this.focused=!1,this.focusedOptionIndex=-1,this.$emit(`blur`,e),(t=(n=this.formField).onBlur)==null||t.call(n)},onPaste:function(e){this.$emit(`paste`,e)},onKeyDown:function(e){if(this.disabled){e.preventDefault();return}switch(this.$emit(`keydown`,e),e.code){case`ArrowDown`:this.onArrowDownKey(e);break;case`ArrowUp`:this.onArrowUpKey(e);break;case`ArrowLeft`:this.onArrowLeftKey(e);break;case`ArrowRight`:this.onArrowRightKey(e);break;case`Home`:this.onHomeKey(e);break;case`End`:this.onEndKey(e);break;case`PageDown`:this.onPageDownKey(e);break;case`PageUp`:this.onPageUpKey(e);break;case`Enter`:case`NumpadEnter`:this.onEnterKey(e);break;case`Space`:this.onSpaceKey(e);break;case`Escape`:this.onEscapeKey(e),this.overlayVisible&&e.stopPropagation();break;case`Tab`:this.onTabKey(e);break;case`ShiftLeft`:case`ShiftRight`:this.onShiftKey(e);break;case`Backspace`:this.onBackspaceKey(e);break}this.clicked=!1},onInput:function(e){var t=this;if(this.typeahead){this.searchTimeout&&clearTimeout(this.searchTimeout);var n=e.target.value;this.multiple||this.updateModel(e,n),n.length===0?(this.searching=!1,this.hide(),this.$emit(`clear`)):n.length>=this.minLength?(this.focusedOptionIndex=-1,this.searchTimeout=setTimeout(function(){t.search(e,n,`input`)},this.delay)):(this.searching=!1,this.hide())}},onChange:function(e){var t=this;if(this.forceSelection){var n=!1;if(this.visibleOptions&&!this.multiple){var r,i=this.multiple?this.$refs.focusInput.value:(r=this.$refs.focusInput)==null||(r=r.$el)==null?void 0:r.value,a=this.visibleOptions.find(function(e){return t.isOptionMatched(e,i||``)});a!==void 0&&(n=!0,!this.isSelected(a)&&this.onOptionSelect(e,a))}if(!n){if(this.multiple)this.$refs.focusInput.value=``;else{var o=this.$refs.focusInput?.$el;o&&(o.value=``)}this.$emit(`clear`),!this.multiple&&this.updateModel(e,null)}}},onMultipleContainerFocus:function(){this.disabled||(this.focused=!0)},onMultipleContainerBlur:function(){this.focusedMultipleOptionIndex=-1,this.focused=!1},onMultipleContainerKeyDown:function(e){if(this.disabled){e.preventDefault();return}switch(e.code){case`ArrowLeft`:this.onArrowLeftKeyOnMultiple(e);break;case`ArrowRight`:this.onArrowRightKeyOnMultiple(e);break;case`Backspace`:this.onBackspaceKeyOnMultiple(e);break}},onContainerClick:function(e){this.clicked=!0,!(this.disabled||this.searching||this.loading||this.isDropdownClicked(e))&&(!this.overlay||!this.overlay.contains(e.target))&&j(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},onDropdownClick:function(e){var t=void 0;if(this.overlayVisible)this.hide(!0);else{var n=this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el;j(n),t=n.value,this.dropdownMode===`blank`?this.search(e,``,`dropdown`):this.dropdownMode===`current`&&this.search(e,t,`dropdown`)}this.$emit(`dropdown-click`,{originalEvent:e,query:t})},onOptionSelect:function(e,t){var n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!0,r=this.getOptionValue(t);this.multiple?(this.$refs.focusInput.value=``,this.isSelected(t)||this.updateModel(e,[].concat(q(this.d_value||[]),[r]))):this.updateModel(e,r),this.$emit(`option-select`,{originalEvent:e,value:t}),n&&this.hide(!0)},onOptionMouseMove:function(e,t){this.focusOnHover&&this.changeFocusedOptionIndex(e,t)},onOptionSelectRange:function(e){var t=this,n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:-1,r=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1;if(n===-1&&(n=this.findNearestSelectedOptionIndex(r,!0)),r===-1&&(r=this.findNearestSelectedOptionIndex(n)),n!==-1&&r!==-1){var i=Math.min(n,r),a=Math.max(n,r),o=this.visibleOptions.slice(i,a+1).filter(function(e){return t.isValidOption(e)}).filter(function(e){return!t.isSelected(e)}).map(function(e){return t.getOptionValue(e)});this.updateModel(e,[].concat(q(this.d_value||[]),q(o)))}},onClearClick:function(e){this.updateModel(e,null),this.overlayVisible&&this.hide(!0),this.$emit(`clear`)},onOverlayClick:function(e){se.emit(`overlay-click`,{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){switch(e.code){case`Escape`:this.onEscapeKey(e);break}},onArrowDownKey:function(e){if(this.overlayVisible){var t=this.focusedOptionIndex===-1?this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex():this.findNextOptionIndex(this.focusedOptionIndex);this.multiple&&e.shiftKey&&this.onOptionSelectRange(e,this.startRangeIndex,t),this.changeFocusedOptionIndex(e,t),e.preventDefault()}},onArrowUpKey:function(e){if(this.overlayVisible)if(e.altKey)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var t=this.focusedOptionIndex===-1?this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex():this.findPrevOptionIndex(this.focusedOptionIndex);this.multiple&&e.shiftKey&&this.onOptionSelectRange(e,t,this.startRangeIndex),this.changeFocusedOptionIndex(e,t),e.preventDefault()}},onArrowLeftKey:function(e){var t=e.currentTarget;this.focusedOptionIndex=-1,this.multiple&&(_(t.value)&&this.$filled?(j(this.$refs.multiContainer),this.focusedMultipleOptionIndex=this.d_value.length):e.stopPropagation())},onArrowRightKey:function(e){this.focusedOptionIndex=-1,this.multiple&&e.stopPropagation()},onHomeKey:function(e){var t=e.currentTarget,n=t.value.length,r=e.metaKey||e.ctrlKey,i=this.findFirstOptionIndex();this.multiple&&e.shiftKey&&r&&this.onOptionSelectRange(e,i,this.startRangeIndex),t.setSelectionRange(0,e.shiftKey?n:0),this.focusedOptionIndex=-1,e.preventDefault()},onEndKey:function(e){var t=e.currentTarget,n=t.value.length,r=e.metaKey||e.ctrlKey,i=this.findLastOptionIndex();this.multiple&&e.shiftKey&&r&&this.onOptionSelectRange(e,this.startRangeIndex,i),t.setSelectionRange(e.shiftKey?0:n,n),this.focusedOptionIndex=-1,e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.typeahead?this.overlayVisible?(this.focusedOptionIndex!==-1&&(this.multiple&&e.shiftKey?this.onOptionSelectRange(e,this.focusedOptionIndex):this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),e.preventDefault()),this.hide()):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)):this.multiple&&e.target.value.trim()&&(this.updateModel(e,[].concat(q(this.d_value||[]),[e.target.value.trim()])),this.$refs.focusInput.value=``,e.preventDefault())},onSpaceKey:function(e){!this.autoOptionFocus&&this.focusedOptionIndex!==-1&&this.onEnterKey(e)},onEscapeKey:function(e){this.overlayVisible&&this.hide(!0),e.preventDefault()},onTabKey:function(e){this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide()},onShiftKey:function(){this.startRangeIndex=this.focusedOptionIndex},onBackspaceKey:function(e){if(this.multiple){if(w(this.d_value)&&!this.$refs.focusInput.value){var t=this.d_value[this.d_value.length-1],n=this.d_value.slice(0,-1);this.writeValue(n,e),this.$emit(`option-unselect`,{originalEvent:e,value:t})}e.stopPropagation()}},onArrowLeftKeyOnMultiple:function(){this.focusedMultipleOptionIndex=this.focusedMultipleOptionIndex<1?0:this.focusedMultipleOptionIndex-1},onArrowRightKeyOnMultiple:function(){this.focusedMultipleOptionIndex++,this.focusedMultipleOptionIndex>this.d_value.length-1&&(this.focusedMultipleOptionIndex=-1,j(this.$refs.focusInput))},onBackspaceKeyOnMultiple:function(e){this.focusedMultipleOptionIndex!==-1&&this.removeOption(e,this.focusedMultipleOptionIndex)},onOverlayEnter:function(e){N.set(`overlay`,e,this.$primevue.config.zIndex.overlay),r(e,{position:`absolute`,top:`0`}),this.alignOverlay(),this.$attrSelector&&e.setAttribute(this.$attrSelector,``)},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit(`show`)},onOverlayLeave:function(e){e.style.pointerEvents=`none`,this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.$emit(`hide`),this.overlay=null},onOverlayAfterLeave:function(e){N.clear(e)},alignOverlay:function(){var e,t=this.$refs.container,n=t?.parentElement,r=(n==null||(e=n.dataset)==null?void 0:e.pcName)===`inputtags`?n:t;this.appendTo===`self`?l(this.overlay,r):(this.overlay.style.minWidth=g(r)+`px`,E(this.overlay,r))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(t){e.overlayVisible&&e.overlay&&e.isOutsideClicked(t)&&e.hide()},document.addEventListener(`click`,this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&=(document.removeEventListener(`click`,this.outsideClickListener,!0),null)},bindScrollListener:function(){var e=this;this.scrollHandler||=new ce(this.$refs.container,function(){e.overlayVisible&&e.hide()}),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!p()&&e.hide()},window.addEventListener(`resize`,this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&=(window.removeEventListener(`resize`,this.resizeListener),null)},isOutsideClicked:function(e){return!this.overlay.contains(e.target)&&!this.isInputClicked(e)&&!this.isDropdownClicked(e)},isInputClicked:function(e){var t,n=this.$refs.container,r=n?.parentElement,i=(r==null||(t=r.dataset)==null?void 0:t.pcName)===`inputtags`?r:n;return i?e.target===i||i.contains(e.target):!1},isDropdownClicked:function(e){return this.$refs.dropdownButton?e.target===this.$refs.dropdownButton||this.$refs.dropdownButton.contains(e.target):!1},isOptionMatched:function(e,t){return this.isValidOption(e)&&this.getOptionLabel(e)?.toLocaleLowerCase(this.searchLocale)===t.toLocaleLowerCase(this.searchLocale)},isValidOption:function(e){return w(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isEquals:function(e,t){return x(e,t,this.equalityKey)},isSelected:function(e){var t=this,n=this.getOptionValue(e);return this.multiple?(this.d_value||[]).some(function(e){return t.isEquals(e,n)}):this.isEquals(this.d_value,this.getOptionValue(e))},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(t){return e.isValidOption(t)})},findLastOptionIndex:function(){var e=this;return y(this.visibleOptions,function(t){return e.isValidOption(t)})},findNextOptionIndex:function(e){var t=this,n=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(e){return t.isValidOption(e)}):-1;return n>-1?n+e+1:e},findPrevOptionIndex:function(e){var t=this,n=e>0?y(this.visibleOptions.slice(0,e),function(e){return t.isValidOption(e)}):-1;return n>-1?n:e},findSelectedOptionIndex:function(){var e=this;return this.$filled?this.visibleOptions.findIndex(function(t){return e.isValidSelectedOption(t)}):-1},findFirstFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},search:function(e,t,n){var r=this;t!=null&&(n===`input`&&t.trim().length===0||(this.searching=!0,this.$emit(`complete`,{originalEvent:e,query:t}),requestAnimationFrame(function(){requestAnimationFrame(function(){r.searching&&(r.searching=!1,(r.showEmptyMessage||r.visibleOptions.length>0)&&(r.show(),r.focusedOptionIndex=r.overlayVisible&&r.autoOptionFocus?r.findFirstFocusedOptionIndex():-1))})})))},removeOption:function(e,t){var n=this,r=this.d_value[t],i=this.d_value.filter(function(e,n){return n!==t}).map(function(e){return n.getOptionValue(e)});this.updateModel(e,i),this.$emit(`option-unselect`,{originalEvent:e,value:r}),this.dirty=!0,j(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},changeFocusedOptionIndex:function(e,t){this.focusedOptionIndex!==t&&(this.focusedOptionIndex=t,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[t],!1))},scrollInView:function(){var e=this,t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var n=t===-1?e.focusedOptionId:`${e.$id}_${t}`,r=re(e.list,`li[id="${n}"]`);r?r.scrollIntoView&&r.scrollIntoView({block:`nearest`,inline:`start`}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(t===-1?e.focusedOptionIndex:t)})},autoUpdateModel:function(){this.selectOnFocus&&this.autoOptionFocus&&!this.$filled&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex(),this.onOptionSelect(null,this.visibleOptions[this.focusedOptionIndex],!1))},updateModel:function(e,t){this.writeValue(t,e),this.$emit(`change`,{originalEvent:e,value:t})},flatOptions:function(e){var t=this;return(e||[]).reduce(function(e,n,r){e.push({optionGroup:n,group:!0,index:r});var i=t.getOptionGroupChildren(n);return i&&i.forEach(function(t){return e.push(t)}),e},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,t){this.list=e,t&&t(e)},virtualScrollerRef:function(e){this.virtualScroller=e},findNextSelectedOptionIndex:function(e){var t=this,n=this.$filled&&e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(e){return t.isValidSelectedOption(e)}):-1;return n>-1?n+e+1:-1},findPrevSelectedOptionIndex:function(e){var t=this,n=this.$filled&&e>0?y(this.visibleOptions.slice(0,e),function(e){return t.isValidSelectedOption(e)}):-1;return n>-1?n:-1},findNearestSelectedOptionIndex:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1],n=-1;return this.$filled&&(t?(n=this.findPrevSelectedOptionIndex(e),n=n===-1?this.findNextSelectedOptionIndex(e):n):(n=this.findNextSelectedOptionIndex(e),n=n===-1?this.findPrevSelectedOptionIndex(e):n)),n>-1?n:e}},computed:{visibleOptions:function(){return this.optionGroupLabel?this.flatOptions(this.suggestions):this.suggestions||[]},inputValue:function(){return this.$filled?K(this.d_value)===`object`?this.getOptionLabel(this.d_value)??this.d_value:this.d_value:``},equalityKey:function(){return this.dataKey},searchResultMessageText:function(){return w(this.visibleOptions)&&this.overlayVisible?this.searchMessageText.replaceAll(`{0}`,this.visibleOptions.length):this.emptySearchMessageText},searchMessageText:function(){return this.searchMessage||this.$primevue.config.locale.searchMessage||``},emptySearchMessageText:function(){return this.emptySearchMessage||this.$primevue.config.locale.emptySearchMessage||``},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||``},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||``},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll(`{0}`,this.multiple?this.d_value.length:`1`):this.emptySelectionMessageText},listAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.listLabel:void 0},focusedOptionId:function(){return this.focusedOptionIndex===-1?null:`${this.$id}_${this.focusedOptionIndex}`},focusedMultipleOptionId:function(){return this.focusedMultipleOptionIndex===-1?null:`${this.$id}_multiple_option_${this.focusedMultipleOptionIndex}`},isClearIconVisible:function(){return this.showClear&&this.$filled&&!this.disabled&&!this.loading},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(t){return!e.isOptionGroup(t)}).length},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},panelId:function(){return this.$id+`_panel`},containerDataP:function(){return C({fluid:this.$fluid})},overlayDataP:function(){return C(G({},`portal-`+this.appendTo,`portal-`+this.appendTo))},inputMultipleDataP:function(){return C(G({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant===`filled`,empty:!this.$filled},this.size,this.size))}},components:{InputText:I,VirtualScroller:F,Portal:ae,Chip:z,ChevronDown:L,Spinner:te,Times:ie},directives:{ripple:ee}};function X(e){"@babel/helpers - typeof";return X=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},X(e)}function Z(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function Q(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]==null?{}:arguments[t];t%2?Z(Object(n),!0).forEach(function(t){he(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Z(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function he(e,t,n){return(t=ge(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function ge(e){var t=_e(e,`string`);return X(t)==`symbol`?t:t+``}function _e(e,t){if(X(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(X(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}var ve=[`data-p`],ye=[`aria-activedescendant`,`data-p-has-dropdown`,`data-p`],be=[`id`,`aria-label`,`aria-setsize`,`aria-posinset`],$=[`id`,`placeholder`,`tabindex`,`disabled`,`aria-label`,`aria-labelledby`,`aria-expanded`,`aria-controls`,`aria-activedescendant`,`aria-invalid`],xe=[`data-p-has-dropdown`],Se=[`disabled`,`aria-expanded`,`aria-controls`],Ce=[`id`,`data-p`],we=[`id`,`aria-label`],Te=[`id`],Ee=[`id`,`aria-label`,`aria-selected`,`aria-disabled`,`aria-setsize`,`aria-posinset`,`onClick`,`onMousemove`,`data-p-selected`,`data-p-focused`,`data-p-disabled`];function De(r,l,p,g,_,y){var b=n(`InputText`),x=n(`Times`),C=n(`Chip`),w=n(`Spinner`),E=n(`VirtualScroller`),D=n(`Portal`),k=S(`ripple`);return m(),i(`div`,a({ref:`container`,class:r.cx(`root`),style:r.sx(`root`),onClick:l[12]||=function(){return y.onContainerClick&&y.onContainerClick.apply(y,arguments)},"data-p":y.containerDataP},r.ptmi(`root`)),[r.multiple?u(``,!0):(m(),c(b,a({key:0,ref:`focusInput`,id:r.inputId,type:`text`,name:r.$formName,formControl:{novalidate:!0},class:[r.cx(`pcInputText`),r.inputClass],style:r.inputStyle,defaultValue:y.inputValue,placeholder:r.placeholder,tabindex:r.disabled?-1:r.tabindex,fluid:r.$fluid,disabled:r.disabled,size:r.size,invalid:r.$invalid,variant:r.variant,autocomplete:`off`,role:`combobox`,"aria-label":r.ariaLabel,"aria-labelledby":r.ariaLabelledby,"aria-haspopup":`listbox`,"aria-autocomplete":`list`,"aria-expanded":_.overlayVisible,"aria-controls":_.overlayVisible?y.panelId:void 0,"aria-activedescendant":_.focused?y.focusedOptionId:void 0,onFocus:y.onFocus,onBlur:y.onBlur,onKeydown:y.onKeyDown,onInput:y.onInput,onChange:y.onChange,onPaste:y.onPaste,unstyled:r.unstyled,"data-p-has-dropdown":r.dropdown},r.inputProps,{pt:r.ptm(`pcInputText`)}),null,16,`id.name.class.style.defaultValue.placeholder.tabindex.fluid.disabled.size.invalid.variant.aria-label.aria-labelledby.aria-expanded.aria-controls.aria-activedescendant.onFocus.onBlur.onKeydown.onInput.onChange.onPaste.unstyled.data-p-has-dropdown.pt`.split(`.`))),y.isClearIconVisible?d(r.$slots,`clearicon`,{key:1,class:t(r.cx(`clearIcon`)),clearCallback:y.onClearClick},function(){return[M(x,a({class:[r.cx(`clearIcon`)],onClick:y.onClearClick},r.ptm(`clearIcon`)),null,16,[`class`,`onClick`])]}):u(``,!0),r.multiple?(m(),i(`ul`,a({key:2,ref:`multiContainer`,class:r.cx(`inputMultiple`),tabindex:`-1`,role:`listbox`,"aria-orientation":`horizontal`,"aria-activedescendant":_.focused?y.focusedMultipleOptionId:void 0,onFocus:l[6]||=function(){return y.onMultipleContainerFocus&&y.onMultipleContainerFocus.apply(y,arguments)},onBlur:l[7]||=function(){return y.onMultipleContainerBlur&&y.onMultipleContainerBlur.apply(y,arguments)},onKeydown:l[8]||=function(){return y.onMultipleContainerKeyDown&&y.onMultipleContainerKeyDown.apply(y,arguments)},"data-p-has-dropdown":r.dropdown,"data-p":y.inputMultipleDataP},r.ptm(`inputMultiple`)),[(m(!0),i(T,null,h(r.d_value,function(e,n){return m(),i(`li`,a({key:`${n}_${y.getOptionLabel(e)}`,id:r.$id+`_multiple_option_`+n,class:r.cx(`chipItem`,{i:n}),role:`option`,"aria-label":y.getOptionLabel(e),"aria-selected":!0,"aria-setsize":r.d_value.length,"aria-posinset":n+1},{ref_for:!0},r.ptm(`chipItem`)),[d(r.$slots,`chip`,a({class:r.cx(`pcChip`),value:e,index:n,removeCallback:function(e){return y.removeOption(e,n)}},{ref_for:!0},r.ptm(`pcChip`)),function(){return[M(C,{class:t(r.cx(`pcChip`)),label:y.getOptionLabel(e),removeIcon:r.chipIcon,removable:``,unstyled:r.unstyled,onRemove:function(e){return y.removeOption(e,n)},"data-p-focused":_.focusedMultipleOptionIndex===n,pt:r.ptm(`pcChip`)},{removeicon:v(function(){return[d(r.$slots,`chipicon`,{class:t(r.cx(`chipIcon`)),index:n,removeCallback:function(e){return y.removeOption(e,n)}})]}),_:2},1032,[`class`,`label`,`removeIcon`,`unstyled`,`onRemove`,`data-p-focused`,`pt`])]})],16,be)}),128)),s(`li`,a({class:r.cx(`inputChip`),role:`option`},r.ptm(`inputChip`)),[s(`input`,a({ref:`focusInput`,id:r.inputId,type:`text`,style:r.inputStyle,class:r.inputClass,placeholder:r.placeholder,tabindex:r.disabled?-1:r.tabindex,disabled:r.disabled,autocomplete:`off`,role:`combobox`,"aria-label":r.ariaLabel,"aria-labelledby":r.ariaLabelledby,"aria-haspopup":`listbox`,"aria-autocomplete":`list`,"aria-expanded":_.overlayVisible,"aria-controls":r.$id+`_list`,"aria-activedescendant":_.focused?y.focusedOptionId:void 0,"aria-invalid":r.invalid||void 0,onFocus:l[0]||=function(){return y.onFocus&&y.onFocus.apply(y,arguments)},onBlur:l[1]||=function(){return y.onBlur&&y.onBlur.apply(y,arguments)},onKeydown:l[2]||=function(){return y.onKeyDown&&y.onKeyDown.apply(y,arguments)},onInput:l[3]||=function(){return y.onInput&&y.onInput.apply(y,arguments)},onChange:l[4]||=function(){return y.onChange&&y.onChange.apply(y,arguments)},onPaste:l[5]||=function(){return y.onPaste&&y.onPaste.apply(y,arguments)}},Q(Q({},r.inputProps),r.ptm(`input`))),null,16,$)],16)],16,ye)):u(``,!0),_.searching||r.loading?d(r.$slots,`loader`,{key:3,class:t(r.cx(`loader`))},function(){return[r.loader?(m(),i(`i`,a({key:0,class:[`pi-spin`,r.cx(`loader`),r.loader],"aria-hidden":`true`,"data-p-has-dropdown":r.dropdown},r.ptm(`loader`)),null,16,xe)):r.loading?(m(),c(w,a({key:1,class:r.cx(`loader`),spin:``,"aria-hidden":`true`,"data-p-has-dropdown":r.dropdown},r.ptm(`loader`)),null,16,[`class`,`data-p-has-dropdown`])):u(``,!0)]}):u(``,!0),d(r.$slots,`dropdown`,{toggleCallback:function(e){return y.onDropdownClick(e)}},function(){return[r.dropdown?(m(),i(`button`,a({key:0,ref:`dropdownButton`,type:`button`,class:[r.cx(`dropdown`),r.dropdownClass],disabled:r.disabled,"aria-haspopup":`listbox`,"aria-expanded":_.overlayVisible,"aria-controls":y.panelId,onClick:l[9]||=function(){return y.onDropdownClick&&y.onDropdownClick.apply(y,arguments)}},r.ptm(`dropdown`)),[d(r.$slots,`dropdownicon`,{class:t(r.dropdownIcon)},function(){return[(m(),c(A(r.dropdownIcon?`span`:`ChevronDown`),a({class:r.dropdownIcon},r.ptm(`dropdownIcon`)),null,16,[`class`]))]})],16,Se)):u(``,!0)]}),r.typeahead?(m(),i(`span`,a({key:4,role:`status`,"aria-live":`polite`,class:`p-hidden-accessible`},r.ptm(`hiddenSearchResult`),{"data-p-hidden-accessible":!0}),e(y.searchResultMessageText),17)):u(``,!0),M(D,{appendTo:r.appendTo},{default:v(function(){return[M(ne,a({name:`p-anchored-overlay`,onEnter:y.onOverlayEnter,onAfterEnter:y.onOverlayAfterEnter,onLeave:y.onOverlayLeave,onAfterLeave:y.onOverlayAfterLeave},r.ptm(`transition`)),{default:v(function(){return[_.overlayVisible?(m(),i(`div`,a({key:0,ref:y.overlayRef,id:y.panelId,class:[r.cx(`overlay`),r.panelClass,r.overlayClass],style:Q(Q({},r.panelStyle),r.overlayStyle),onClick:l[10]||=function(){return y.onOverlayClick&&y.onOverlayClick.apply(y,arguments)},onKeydown:l[11]||=function(){return y.onOverlayKeyDown&&y.onOverlayKeyDown.apply(y,arguments)},"data-p":y.overlayDataP},r.ptm(`overlay`)),[d(r.$slots,`header`,{value:r.d_value,suggestions:y.visibleOptions}),s(`div`,a({class:r.cx(`listContainer`),style:{"max-height":y.virtualScrollerDisabled?r.scrollHeight:``}},r.ptm(`listContainer`)),[M(E,a({ref:y.virtualScrollerRef},r.virtualScrollerOptions,{style:{height:r.scrollHeight},items:y.visibleOptions,tabindex:-1,disabled:y.virtualScrollerDisabled,pt:r.ptm(`virtualScroller`)}),o({content:v(function(t){var n=t.styleClass,o=t.contentRef,c=t.items,l=t.getItemOptions,p=t.contentStyle,g=t.itemSize;return[s(`ul`,a({ref:function(e){return y.listRef(e,o)},id:r.$id+`_list`,class:[r.cx(`list`),n],style:p,role:`listbox`,"aria-label":y.listAriaLabel},r.ptm(`list`)),[(m(!0),i(T,null,h(c,function(t,n){return m(),i(T,{key:y.getOptionRenderKey(t,y.getOptionIndex(n,l))},[y.isOptionGroup(t)?(m(),i(`li`,a({key:0,id:r.$id+`_`+y.getOptionIndex(n,l),style:{height:g?g+`px`:void 0},class:r.cx(`optionGroup`),role:`option`},{ref_for:!0},r.ptm(`optionGroup`)),[d(r.$slots,`optiongroup`,{option:t.optionGroup,index:y.getOptionIndex(n,l)},function(){return[f(e(y.getOptionGroupLabel(t.optionGroup)),1)]})],16,Te)):O((m(),i(`li`,a({key:1,id:r.$id+`_`+y.getOptionIndex(n,l),style:{height:g?g+`px`:void 0},class:r.cx(`option`,{option:t,i:n,getItemOptions:l}),role:`option`,"aria-label":y.getOptionLabel(t),"aria-selected":y.isSelected(t),"aria-disabled":y.isOptionDisabled(t),"aria-setsize":y.ariaSetSize,"aria-posinset":y.getAriaPosInset(y.getOptionIndex(n,l)),onClick:function(e){return y.onOptionSelect(e,t)},onMousemove:function(e){return y.onOptionMouseMove(e,y.getOptionIndex(n,l))},"data-p-selected":y.isSelected(t),"data-p-focused":_.focusedOptionIndex===y.getOptionIndex(n,l),"data-p-disabled":y.isOptionDisabled(t)},{ref_for:!0},y.getPTOptions(t,l,n,`option`)),[d(r.$slots,`option`,{option:t,index:y.getOptionIndex(n,l)},function(){return[f(e(y.getOptionLabel(t)),1)]})],16,Ee)),[[k]])],64)}),128)),r.showEmptyMessage&&(!c||c&&c.length===0)?(m(),i(`li`,a({key:0,class:r.cx(`emptyMessage`),role:`option`},r.ptm(`emptyMessage`)),[d(r.$slots,`empty`,{},function(){return[f(e(y.searchResultMessageText),1)]})],16)):u(``,!0)],16,we)]}),_:2},[r.$slots.loader?{name:`loader`,fn:v(function(e){var t=e.options;return[d(r.$slots,`loader`,{options:t})]}),key:`0`}:void 0]),1040,[`style`,`items`,`disabled`,`pt`])],16),d(r.$slots,`footer`,{value:r.d_value,suggestions:y.visibleOptions}),s(`span`,a({role:`status`,"aria-live":`polite`,class:`p-hidden-accessible`},r.ptm(`hiddenSelectedMessage`),{"data-p-hidden-accessible":!0}),e(y.selectedMessageText),17)],16,Ce)):u(``,!0)]}),_:3},16,[`onEnter`,`onAfterEnter`,`onLeave`,`onAfterLeave`])]}),_:3},8,[`appendTo`])],16,ve)}Y.render=De;export{Y as t};