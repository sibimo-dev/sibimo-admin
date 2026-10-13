import{$t as e,At as t,Bt as n,C as r,Ft as i,Ht as a,It as o,Kt as s,Lt as c,Mt as l,Nt as u,P as d,Pt as f,Qt as p,Rt as m,Sn as h,Xt as g,Y as _,Yt as v,_ as y,_t as b,an as x,bn as S,bt as C,d as w,dt as T,en as E,h as D,hn as O,ht as k,nn as A,nt as ee,o as te,on as ne,pn as re,pt as j,r as ie,s as ae,tn as oe,wn as M,x as N,xn as P,xt as se,z as ce,zt as F}from"./api-COzKJGgn.js";import{n as le,r as I,t as ue}from"./portal-CWqOees0.js";import{M as de,O as fe,P as pe,T as me,V as he,b as L,j as R,k as ge,n as z,t as B,w as _e}from"./index-CFiVrhah.js";import{t as V}from"./AppInput-1afinDll.js";import{t as H}from"./AppButton-DESiurxz.js";import{i as ve}from"./citizen.service-oKOM-aTy.js";import{r as ye,s as be}from"./library.service-CvW1Zl9u.js";var xe=w.extend({name:`chip`,style:`
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
`,classes:{root:`p-chip p-component`,image:`p-chip-image`,icon:`p-chip-icon`,label:`p-chip-label`,removeIcon:`p-chip-remove-icon`}}),U={name:`Chip`,extends:{name:`BaseChip`,extends:te,props:{label:{type:[String,Number],default:null},icon:{type:String,default:null},image:{type:String,default:null},removable:{type:Boolean,default:!1},removeIcon:{type:String,default:void 0}},style:xe,provide:function(){return{$pcChip:this,$parentInstance:this}}},inheritAttrs:!1,emits:[`remove`],data:function(){return{visible:!0}},methods:{onKeydown:function(e){(e.key===`Enter`||e.key===`Backspace`)&&this.close(e)},close:function(e){this.visible=!1,this.$emit(`remove`,e)}},computed:{dataP:function(){return D({removable:this.removable})}},components:{TimesCircle:fe}},Se=[`data-p`],Ce=[`src`];function we(t,n,r,a,c,l){return c.visible?(g(),o(`div`,s({key:0,class:t.cx(`root`)},t.ptmi(`root`),{"data-p":l.dataP}),[e(t.$slots,`default`,{},function(){return[t.image?(g(),o(`img`,s({key:0,src:t.image},t.ptm(`image`),{class:t.cx(`image`)}),null,16,Ce)):t.$slots.icon?(g(),f(A(t.$slots.icon),s({key:1,class:t.cx(`icon`)},t.ptm(`icon`)),null,16,[`class`])):t.icon?(g(),o(`span`,s({key:2,class:[t.cx(`icon`),t.icon]},t.ptm(`icon`)),null,16)):i(``,!0),t.label===null?i(``,!0):(g(),o(`div`,s({key:3,class:t.cx(`label`)},t.ptm(`label`)),M(t.label),17))]}),t.removable?e(t.$slots,`removeicon`,{key:0,removeCallback:l.close,keydownCallback:l.onKeydown},function(){return[(g(),f(A(t.removeIcon?`span`:`TimesCircle`),s({class:[t.cx(`removeIcon`),t.removeIcon],tabindex:`0`,onClick:l.close,onKeydown:l.onKeydown},t.ptm(`removeIcon`)),null,16,[`class`,`onClick`,`onKeydown`]))]}):i(``,!0)],16,Se)):i(``,!0)}U.render=we;var Te=w.extend({name:`autocomplete`,style:`
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
`,classes:{root:function(e){var t=e.instance;return[`p-autocomplete p-component p-inputwrapper`,{"p-invalid":t.$invalid,"p-focus":t.focused,"p-inputwrapper-filled":t.$filled||k(t.inputValue),"p-inputwrapper-focus":t.focused,"p-autocomplete-open":t.overlayVisible,"p-autocomplete-fluid":t.$fluid}]},pcInputText:`p-autocomplete-input`,inputMultiple:function(e){var t=e.instance,n=e.props;return[`p-autocomplete-input-multiple`,{"p-variant-filled":t.$variant===`filled`,"p-disabled":n.disabled}]},clearIcon:`p-autocomplete-clear-icon`,chipItem:function(e){var t=e.instance,n=e.i;return[`p-autocomplete-chip-item`,{"p-focus":t.focusedMultipleOptionIndex===n}]},pcChip:`p-autocomplete-chip`,chipIcon:`p-autocomplete-chip-icon`,inputChip:`p-autocomplete-input-chip`,loader:`p-autocomplete-loader`,dropdown:`p-autocomplete-dropdown`,overlay:`p-autocomplete-overlay p-component`,listContainer:`p-autocomplete-list-container`,list:`p-autocomplete-list`,optionGroup:`p-autocomplete-option-group`,option:function(e){var t=e.instance,n=e.option,r=e.i,i=e.getItemOptions;return[`p-autocomplete-option`,{"p-autocomplete-option-selected":t.isSelected(n),"p-focus":t.focusedOptionIndex===t.getOptionIndex(r,i),"p-disabled":t.isOptionDisabled(n)}]},emptyMessage:`p-autocomplete-empty-message`},inlineStyles:{root:{position:`relative`}}}),Ee={name:`BaseAutoComplete`,extends:me,props:{suggestions:{type:Array,default:null},optionLabel:null,optionDisabled:null,optionGroupLabel:null,optionGroupChildren:null,scrollHeight:{type:String,default:`14rem`},dropdown:{type:Boolean,default:!1},dropdownMode:{type:String,default:`blank`},multiple:{type:Boolean,default:!1},loading:{type:Boolean,default:!1},placeholder:{type:String,default:null},dataKey:{type:String,default:null},minLength:{type:Number,default:1},delay:{type:Number,default:300},appendTo:{type:[String,Object],default:`body`},forceSelection:{type:Boolean,default:!1},completeOnFocus:{type:Boolean,default:!1},showClear:{type:Boolean,default:!1},inputId:{type:String,default:null},inputStyle:{type:Object,default:null},inputClass:{type:[String,Object],default:null},inputProps:{type:null,default:null},panelStyle:{type:Object,default:null},panelClass:{type:[String,Object],default:null},overlayStyle:{type:Object,default:null},overlayClass:{type:[String,Object],default:null},dropdownIcon:{type:String,default:null},dropdownClass:{type:[String,Object],default:null},loader:{type:String,default:null},chipIcon:{type:String,default:null},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},selectOnFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},searchLocale:{type:String,default:void 0},searchMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptySearchMessage:{type:String,default:null},showEmptyMessage:{type:Boolean,default:!0},tabindex:{type:Number,default:0},typeahead:{type:Boolean,default:!0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:Te,provide:function(){return{$pcAutoComplete:this,$parentInstance:this}}};function W(e,t,n){return(t=De(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function De(e){var t=Oe(e,`string`);return G(t)==`symbol`?t:t+``}function Oe(e,t){if(G(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(G(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function G(e){"@babel/helpers - typeof";return G=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},G(e)}function K(e){return Me(e)||je(e)||Ae(e)||ke()}function ke(){throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Ae(e,t){if(e){if(typeof e==`string`)return q(e,t);var n={}.toString.call(e).slice(8,-1);return n===`Object`&&e.constructor&&(n=e.constructor.name),n===`Map`||n===`Set`?Array.from(e):n===`Arguments`||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?q(e,t):void 0}}function je(e){if(typeof Symbol<`u`&&e[Symbol.iterator]!=null||e[`@@iterator`]!=null)return Array.from(e)}function Me(e){if(Array.isArray(e))return q(e)}function q(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,r=Array(t);n<t;n++)r[n]=e[n];return r}var J={name:`AutoComplete`,extends:Ee,inheritAttrs:!1,emits:[`change`,`focus`,`blur`,`option-select`,`option-unselect`,`dropdown-click`,`clear`,`complete`,`before-show`,`before-hide`,`show`,`hide`,`keydown`,`paste`],inject:{$pcFluid:{default:null}},outsideClickListener:null,resizeListener:null,scrollHandler:null,overlay:null,virtualScroller:null,searchTimeout:null,dirty:!1,startRangeIndex:-1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,focusedMultipleOptionIndex:-1,overlayVisible:!1,searching:!1}},watch:{suggestions:function(){this.searching&&(this.show(),this.focusedOptionIndex=this.overlayVisible&&this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1,this.searching=!1,!this.showEmptyMessage&&this.visibleOptions.length===0&&this.hide()),this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel()},updated:function(){this.overlayVisible&&this.alignOverlay()},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.scrollHandler&&=(this.scrollHandler.destroy(),null),this.overlay&&=(I.clear(this.overlay),null)},methods:{getOptionIndex:function(e,t){return this.virtualScrollerDisabled?e:t&&t(e).index},getOptionLabel:function(e){return this.optionLabel?j(e,this.optionLabel):e},getOptionValue:function(e){return e},getOptionRenderKey:function(e,t){return(this.dataKey?j(e,this.dataKey):this.getOptionLabel(e))+`_`+t},getPTOptions:function(e,t,n,r){return this.ptm(r,{context:{option:e,index:n,selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(n,t),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.optionDisabled?j(e,this.optionDisabled):!1},isOptionGroup:function(e){return this.optionGroupLabel&&e.optionGroup&&e.group},getOptionGroupLabel:function(e){return j(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return j(e,this.optionGroupChildren)},getAriaPosInset:function(e){var t=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(e){return t.isOptionGroup(e)}).length:e)+1},show:function(e){this.$emit(`before-show`),this.dirty=!0,this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex===-1?this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1:this.focusedOptionIndex,e&&N(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},hide:function(e){var t=this,n=function(){t.$emit(`before-hide`),t.dirty=e,t.overlayVisible=!1,t.clicked=!1,t.focusedOptionIndex=-1,e&&N(t.multiple?t.$refs.focusInput:t.$refs.focusInput?.$el)};setTimeout(function(){n()},0)},onFocus:function(e){this.disabled||(!this.dirty&&this.completeOnFocus&&this.search(e,e.target.value,`focus`),this.dirty=!0,this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex===-1?this.overlayVisible&&this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1:this.focusedOptionIndex,this.scrollInView(this.focusedOptionIndex)),this.$emit(`focus`,e))},onBlur:function(e){var t,n;this.dirty=!1,this.focused=!1,this.focusedOptionIndex=-1,this.$emit(`blur`,e),(t=(n=this.formField).onBlur)==null||t.call(n)},onPaste:function(e){this.$emit(`paste`,e)},onKeyDown:function(e){if(this.disabled){e.preventDefault();return}switch(this.$emit(`keydown`,e),e.code){case`ArrowDown`:this.onArrowDownKey(e);break;case`ArrowUp`:this.onArrowUpKey(e);break;case`ArrowLeft`:this.onArrowLeftKey(e);break;case`ArrowRight`:this.onArrowRightKey(e);break;case`Home`:this.onHomeKey(e);break;case`End`:this.onEndKey(e);break;case`PageDown`:this.onPageDownKey(e);break;case`PageUp`:this.onPageUpKey(e);break;case`Enter`:case`NumpadEnter`:this.onEnterKey(e);break;case`Space`:this.onSpaceKey(e);break;case`Escape`:this.onEscapeKey(e),this.overlayVisible&&e.stopPropagation();break;case`Tab`:this.onTabKey(e);break;case`ShiftLeft`:case`ShiftRight`:this.onShiftKey(e);break;case`Backspace`:this.onBackspaceKey(e);break}this.clicked=!1},onInput:function(e){var t=this;if(this.typeahead){this.searchTimeout&&clearTimeout(this.searchTimeout);var n=e.target.value;this.multiple||this.updateModel(e,n),n.length===0?(this.searching=!1,this.hide(),this.$emit(`clear`)):n.length>=this.minLength?(this.focusedOptionIndex=-1,this.searchTimeout=setTimeout(function(){t.search(e,n,`input`)},this.delay)):(this.searching=!1,this.hide())}},onChange:function(e){var t=this;if(this.forceSelection){var n=!1;if(this.visibleOptions&&!this.multiple){var r,i=this.multiple?this.$refs.focusInput.value:(r=this.$refs.focusInput)==null||(r=r.$el)==null?void 0:r.value,a=this.visibleOptions.find(function(e){return t.isOptionMatched(e,i||``)});a!==void 0&&(n=!0,!this.isSelected(a)&&this.onOptionSelect(e,a))}if(!n){if(this.multiple)this.$refs.focusInput.value=``;else{var o=this.$refs.focusInput?.$el;o&&(o.value=``)}this.$emit(`clear`),!this.multiple&&this.updateModel(e,null)}}},onMultipleContainerFocus:function(){this.disabled||(this.focused=!0)},onMultipleContainerBlur:function(){this.focusedMultipleOptionIndex=-1,this.focused=!1},onMultipleContainerKeyDown:function(e){if(this.disabled){e.preventDefault();return}switch(e.code){case`ArrowLeft`:this.onArrowLeftKeyOnMultiple(e);break;case`ArrowRight`:this.onArrowRightKeyOnMultiple(e);break;case`Backspace`:this.onBackspaceKeyOnMultiple(e);break}},onContainerClick:function(e){this.clicked=!0,!(this.disabled||this.searching||this.loading||this.isDropdownClicked(e))&&(!this.overlay||!this.overlay.contains(e.target))&&N(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},onDropdownClick:function(e){var t=void 0;if(this.overlayVisible)this.hide(!0);else{var n=this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el;N(n),t=n.value,this.dropdownMode===`blank`?this.search(e,``,`dropdown`):this.dropdownMode===`current`&&this.search(e,t,`dropdown`)}this.$emit(`dropdown-click`,{originalEvent:e,query:t})},onOptionSelect:function(e,t){var n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!0,r=this.getOptionValue(t);this.multiple?(this.$refs.focusInput.value=``,this.isSelected(t)||this.updateModel(e,[].concat(K(this.d_value||[]),[r]))):this.updateModel(e,r),this.$emit(`option-select`,{originalEvent:e,value:t}),n&&this.hide(!0)},onOptionMouseMove:function(e,t){this.focusOnHover&&this.changeFocusedOptionIndex(e,t)},onOptionSelectRange:function(e){var t=this,n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:-1,r=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1;if(n===-1&&(n=this.findNearestSelectedOptionIndex(r,!0)),r===-1&&(r=this.findNearestSelectedOptionIndex(n)),n!==-1&&r!==-1){var i=Math.min(n,r),a=Math.max(n,r),o=this.visibleOptions.slice(i,a+1).filter(function(e){return t.isValidOption(e)}).filter(function(e){return!t.isSelected(e)}).map(function(e){return t.getOptionValue(e)});this.updateModel(e,[].concat(K(this.d_value||[]),K(o)))}},onClearClick:function(e){this.updateModel(e,null),this.overlayVisible&&this.hide(!0),this.$emit(`clear`)},onOverlayClick:function(e){R.emit(`overlay-click`,{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){switch(e.code){case`Escape`:this.onEscapeKey(e);break}},onArrowDownKey:function(e){if(this.overlayVisible){var t=this.focusedOptionIndex===-1?this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex():this.findNextOptionIndex(this.focusedOptionIndex);this.multiple&&e.shiftKey&&this.onOptionSelectRange(e,this.startRangeIndex,t),this.changeFocusedOptionIndex(e,t),e.preventDefault()}},onArrowUpKey:function(e){if(this.overlayVisible)if(e.altKey)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var t=this.focusedOptionIndex===-1?this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex():this.findPrevOptionIndex(this.focusedOptionIndex);this.multiple&&e.shiftKey&&this.onOptionSelectRange(e,t,this.startRangeIndex),this.changeFocusedOptionIndex(e,t),e.preventDefault()}},onArrowLeftKey:function(e){var t=e.currentTarget;this.focusedOptionIndex=-1,this.multiple&&(b(t.value)&&this.$filled?(N(this.$refs.multiContainer),this.focusedMultipleOptionIndex=this.d_value.length):e.stopPropagation())},onArrowRightKey:function(e){this.focusedOptionIndex=-1,this.multiple&&e.stopPropagation()},onHomeKey:function(e){var t=e.currentTarget,n=t.value.length,r=e.metaKey||e.ctrlKey,i=this.findFirstOptionIndex();this.multiple&&e.shiftKey&&r&&this.onOptionSelectRange(e,i,this.startRangeIndex),t.setSelectionRange(0,e.shiftKey?n:0),this.focusedOptionIndex=-1,e.preventDefault()},onEndKey:function(e){var t=e.currentTarget,n=t.value.length,r=e.metaKey||e.ctrlKey,i=this.findLastOptionIndex();this.multiple&&e.shiftKey&&r&&this.onOptionSelectRange(e,this.startRangeIndex,i),t.setSelectionRange(e.shiftKey?0:n,n),this.focusedOptionIndex=-1,e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.typeahead?this.overlayVisible?(this.focusedOptionIndex!==-1&&(this.multiple&&e.shiftKey?this.onOptionSelectRange(e,this.focusedOptionIndex):this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),e.preventDefault()),this.hide()):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)):this.multiple&&e.target.value.trim()&&(this.updateModel(e,[].concat(K(this.d_value||[]),[e.target.value.trim()])),this.$refs.focusInput.value=``,e.preventDefault())},onSpaceKey:function(e){!this.autoOptionFocus&&this.focusedOptionIndex!==-1&&this.onEnterKey(e)},onEscapeKey:function(e){this.overlayVisible&&this.hide(!0),e.preventDefault()},onTabKey:function(e){this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide()},onShiftKey:function(){this.startRangeIndex=this.focusedOptionIndex},onBackspaceKey:function(e){if(this.multiple){if(k(this.d_value)&&!this.$refs.focusInput.value){var t=this.d_value[this.d_value.length-1],n=this.d_value.slice(0,-1);this.writeValue(n,e),this.$emit(`option-unselect`,{originalEvent:e,value:t})}e.stopPropagation()}},onArrowLeftKeyOnMultiple:function(){this.focusedMultipleOptionIndex=this.focusedMultipleOptionIndex<1?0:this.focusedMultipleOptionIndex-1},onArrowRightKeyOnMultiple:function(){this.focusedMultipleOptionIndex++,this.focusedMultipleOptionIndex>this.d_value.length-1&&(this.focusedMultipleOptionIndex=-1,N(this.$refs.focusInput))},onBackspaceKeyOnMultiple:function(e){this.focusedMultipleOptionIndex!==-1&&this.removeOption(e,this.focusedMultipleOptionIndex)},onOverlayEnter:function(e){I.set(`overlay`,e,this.$primevue.config.zIndex.overlay),r(e,{position:`absolute`,top:`0`}),this.alignOverlay(),this.$attrSelector&&e.setAttribute(this.$attrSelector,``)},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit(`show`)},onOverlayLeave:function(e){e.style.pointerEvents=`none`,this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.$emit(`hide`),this.overlay=null},onOverlayAfterLeave:function(e){I.clear(e)},alignOverlay:function(){var e,t=this.$refs.container,n=t?.parentElement,r=(n==null||(e=n.dataset)==null?void 0:e.pcName)===`inputtags`?n:t;this.appendTo===`self`?d(this.overlay,r):(this.overlay.style.minWidth=y(r)+`px`,ee(this.overlay,r))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(t){e.overlayVisible&&e.overlay&&e.isOutsideClicked(t)&&e.hide()},document.addEventListener(`click`,this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&=(document.removeEventListener(`click`,this.outsideClickListener,!0),null)},bindScrollListener:function(){var e=this;this.scrollHandler||=new de(this.$refs.container,function(){e.overlayVisible&&e.hide()}),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!_()&&e.hide()},window.addEventListener(`resize`,this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&=(window.removeEventListener(`resize`,this.resizeListener),null)},isOutsideClicked:function(e){return!this.overlay.contains(e.target)&&!this.isInputClicked(e)&&!this.isDropdownClicked(e)},isInputClicked:function(e){var t,n=this.$refs.container,r=n?.parentElement,i=(r==null||(t=r.dataset)==null?void 0:t.pcName)===`inputtags`?r:n;return i?e.target===i||i.contains(e.target):!1},isDropdownClicked:function(e){return this.$refs.dropdownButton?e.target===this.$refs.dropdownButton||this.$refs.dropdownButton.contains(e.target):!1},isOptionMatched:function(e,t){return this.isValidOption(e)&&this.getOptionLabel(e)?.toLocaleLowerCase(this.searchLocale)===t.toLocaleLowerCase(this.searchLocale)},isValidOption:function(e){return k(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isEquals:function(e,t){return T(e,t,this.equalityKey)},isSelected:function(e){var t=this,n=this.getOptionValue(e);return this.multiple?(this.d_value||[]).some(function(e){return t.isEquals(e,n)}):this.isEquals(this.d_value,this.getOptionValue(e))},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(t){return e.isValidOption(t)})},findLastOptionIndex:function(){var e=this;return C(this.visibleOptions,function(t){return e.isValidOption(t)})},findNextOptionIndex:function(e){var t=this,n=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(e){return t.isValidOption(e)}):-1;return n>-1?n+e+1:e},findPrevOptionIndex:function(e){var t=this,n=e>0?C(this.visibleOptions.slice(0,e),function(e){return t.isValidOption(e)}):-1;return n>-1?n:e},findSelectedOptionIndex:function(){var e=this;return this.$filled?this.visibleOptions.findIndex(function(t){return e.isValidSelectedOption(t)}):-1},findFirstFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},search:function(e,t,n){var r=this;t!=null&&(n===`input`&&t.trim().length===0||(this.searching=!0,this.$emit(`complete`,{originalEvent:e,query:t}),requestAnimationFrame(function(){requestAnimationFrame(function(){r.searching&&(r.searching=!1,(r.showEmptyMessage||r.visibleOptions.length>0)&&(r.show(),r.focusedOptionIndex=r.overlayVisible&&r.autoOptionFocus?r.findFirstFocusedOptionIndex():-1))})})))},removeOption:function(e,t){var n=this,r=this.d_value[t],i=this.d_value.filter(function(e,n){return n!==t}).map(function(e){return n.getOptionValue(e)});this.updateModel(e,i),this.$emit(`option-unselect`,{originalEvent:e,value:r}),this.dirty=!0,N(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},changeFocusedOptionIndex:function(e,t){this.focusedOptionIndex!==t&&(this.focusedOptionIndex=t,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[t],!1))},scrollInView:function(){var e=this,t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var n=t===-1?e.focusedOptionId:`${e.$id}_${t}`,r=ce(e.list,`li[id="${n}"]`);r?r.scrollIntoView&&r.scrollIntoView({block:`nearest`,inline:`start`}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(t===-1?e.focusedOptionIndex:t)})},autoUpdateModel:function(){this.selectOnFocus&&this.autoOptionFocus&&!this.$filled&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex(),this.onOptionSelect(null,this.visibleOptions[this.focusedOptionIndex],!1))},updateModel:function(e,t){this.writeValue(t,e),this.$emit(`change`,{originalEvent:e,value:t})},flatOptions:function(e){var t=this;return(e||[]).reduce(function(e,n,r){e.push({optionGroup:n,group:!0,index:r});var i=t.getOptionGroupChildren(n);return i&&i.forEach(function(t){return e.push(t)}),e},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,t){this.list=e,t&&t(e)},virtualScrollerRef:function(e){this.virtualScroller=e},findNextSelectedOptionIndex:function(e){var t=this,n=this.$filled&&e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(e){return t.isValidSelectedOption(e)}):-1;return n>-1?n+e+1:-1},findPrevSelectedOptionIndex:function(e){var t=this,n=this.$filled&&e>0?C(this.visibleOptions.slice(0,e),function(e){return t.isValidSelectedOption(e)}):-1;return n>-1?n:-1},findNearestSelectedOptionIndex:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1],n=-1;return this.$filled&&(t?(n=this.findPrevSelectedOptionIndex(e),n=n===-1?this.findNextSelectedOptionIndex(e):n):(n=this.findNextSelectedOptionIndex(e),n=n===-1?this.findPrevSelectedOptionIndex(e):n)),n>-1?n:e}},computed:{visibleOptions:function(){return this.optionGroupLabel?this.flatOptions(this.suggestions):this.suggestions||[]},inputValue:function(){return this.$filled?G(this.d_value)===`object`?this.getOptionLabel(this.d_value)??this.d_value:this.d_value:``},equalityKey:function(){return this.dataKey},searchResultMessageText:function(){return k(this.visibleOptions)&&this.overlayVisible?this.searchMessageText.replaceAll(`{0}`,this.visibleOptions.length):this.emptySearchMessageText},searchMessageText:function(){return this.searchMessage||this.$primevue.config.locale.searchMessage||``},emptySearchMessageText:function(){return this.emptySearchMessage||this.$primevue.config.locale.emptySearchMessage||``},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||``},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||``},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll(`{0}`,this.multiple?this.d_value.length:`1`):this.emptySelectionMessageText},listAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.listLabel:void 0},focusedOptionId:function(){return this.focusedOptionIndex===-1?null:`${this.$id}_${this.focusedOptionIndex}`},focusedMultipleOptionId:function(){return this.focusedMultipleOptionIndex===-1?null:`${this.$id}_multiple_option_${this.focusedMultipleOptionIndex}`},isClearIconVisible:function(){return this.showClear&&this.$filled&&!this.disabled&&!this.loading},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(t){return!e.isOptionGroup(t)}).length},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},panelId:function(){return this.$id+`_panel`},containerDataP:function(){return D({fluid:this.$fluid})},overlayDataP:function(){return D(W({},`portal-`+this.appendTo,`portal-`+this.appendTo))},inputMultipleDataP:function(){return D(W({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant===`filled`,empty:!this.$filled},this.size,this.size))}},components:{InputText:_e,VirtualScroller:L,Portal:ue,Chip:U,ChevronDown:pe,Spinner:ae,Times:le},directives:{ripple:ie}};function Y(e){"@babel/helpers - typeof";return Y=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},Y(e)}function X(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function Z(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]==null?{}:arguments[t];t%2?X(Object(n),!0).forEach(function(t){Ne(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):X(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function Ne(e,t,n){return(t=Pe(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Pe(e){var t=Fe(e,`string`);return Y(t)==`symbol`?t:t+``}function Fe(e,t){if(Y(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(Y(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}var Ie=[`data-p`],Le=[`aria-activedescendant`,`data-p-has-dropdown`,`data-p`],Re=[`id`,`aria-label`,`aria-setsize`,`aria-posinset`],ze=[`id`,`placeholder`,`tabindex`,`disabled`,`aria-label`,`aria-labelledby`,`aria-expanded`,`aria-controls`,`aria-activedescendant`,`aria-invalid`],Be=[`data-p-has-dropdown`],Ve=[`disabled`,`aria-expanded`,`aria-controls`],He=[`id`,`data-p`],Ue=[`id`,`aria-label`],We=[`id`],Ge=[`id`,`aria-label`,`aria-selected`,`aria-disabled`,`aria-setsize`,`aria-posinset`,`onClick`,`onMousemove`,`data-p-selected`,`data-p-focused`,`data-p-disabled`];function Ke(r,a,l,d,m,h){var _=E(`InputText`),v=E(`Times`),y=E(`Chip`),b=E(`Spinner`),S=E(`VirtualScroller`),C=E(`Portal`),w=oe(`ripple`);return g(),o(`div`,s({ref:`container`,class:r.cx(`root`),style:r.sx(`root`),onClick:a[12]||=function(){return h.onContainerClick&&h.onContainerClick.apply(h,arguments)},"data-p":h.containerDataP},r.ptmi(`root`)),[r.multiple?i(``,!0):(g(),f(_,s({key:0,ref:`focusInput`,id:r.inputId,type:`text`,name:r.$formName,formControl:{novalidate:!0},class:[r.cx(`pcInputText`),r.inputClass],style:r.inputStyle,defaultValue:h.inputValue,placeholder:r.placeholder,tabindex:r.disabled?-1:r.tabindex,fluid:r.$fluid,disabled:r.disabled,size:r.size,invalid:r.$invalid,variant:r.variant,autocomplete:`off`,role:`combobox`,"aria-label":r.ariaLabel,"aria-labelledby":r.ariaLabelledby,"aria-haspopup":`listbox`,"aria-autocomplete":`list`,"aria-expanded":m.overlayVisible,"aria-controls":m.overlayVisible?h.panelId:void 0,"aria-activedescendant":m.focused?h.focusedOptionId:void 0,onFocus:h.onFocus,onBlur:h.onBlur,onKeydown:h.onKeyDown,onInput:h.onInput,onChange:h.onChange,onPaste:h.onPaste,unstyled:r.unstyled,"data-p-has-dropdown":r.dropdown},r.inputProps,{pt:r.ptm(`pcInputText`)}),null,16,`id.name.class.style.defaultValue.placeholder.tabindex.fluid.disabled.size.invalid.variant.aria-label.aria-labelledby.aria-expanded.aria-controls.aria-activedescendant.onFocus.onBlur.onKeydown.onInput.onChange.onPaste.unstyled.data-p-has-dropdown.pt`.split(`.`))),h.isClearIconVisible?e(r.$slots,`clearicon`,{key:1,class:P(r.cx(`clearIcon`)),clearCallback:h.onClearClick},function(){return[n(v,s({class:[r.cx(`clearIcon`)],onClick:h.onClearClick},r.ptm(`clearIcon`)),null,16,[`class`,`onClick`])]}):i(``,!0),r.multiple?(g(),o(`ul`,s({key:2,ref:`multiContainer`,class:r.cx(`inputMultiple`),tabindex:`-1`,role:`listbox`,"aria-orientation":`horizontal`,"aria-activedescendant":m.focused?h.focusedMultipleOptionId:void 0,onFocus:a[6]||=function(){return h.onMultipleContainerFocus&&h.onMultipleContainerFocus.apply(h,arguments)},onBlur:a[7]||=function(){return h.onMultipleContainerBlur&&h.onMultipleContainerBlur.apply(h,arguments)},onKeydown:a[8]||=function(){return h.onMultipleContainerKeyDown&&h.onMultipleContainerKeyDown.apply(h,arguments)},"data-p-has-dropdown":r.dropdown,"data-p":h.inputMultipleDataP},r.ptm(`inputMultiple`)),[(g(!0),o(t,null,p(r.d_value,function(t,i){return g(),o(`li`,s({key:`${i}_${h.getOptionLabel(t)}`,id:r.$id+`_multiple_option_`+i,class:r.cx(`chipItem`,{i}),role:`option`,"aria-label":h.getOptionLabel(t),"aria-selected":!0,"aria-setsize":r.d_value.length,"aria-posinset":i+1},{ref_for:!0},r.ptm(`chipItem`)),[e(r.$slots,`chip`,s({class:r.cx(`pcChip`),value:t,index:i,removeCallback:function(e){return h.removeOption(e,i)}},{ref_for:!0},r.ptm(`pcChip`)),function(){return[n(y,{class:P(r.cx(`pcChip`)),label:h.getOptionLabel(t),removeIcon:r.chipIcon,removable:``,unstyled:r.unstyled,onRemove:function(e){return h.removeOption(e,i)},"data-p-focused":m.focusedMultipleOptionIndex===i,pt:r.ptm(`pcChip`)},{removeicon:x(function(){return[e(r.$slots,`chipicon`,{class:P(r.cx(`chipIcon`)),index:i,removeCallback:function(e){return h.removeOption(e,i)}})]}),_:2},1032,[`class`,`label`,`removeIcon`,`unstyled`,`onRemove`,`data-p-focused`,`pt`])]})],16,Re)}),128)),u(`li`,s({class:r.cx(`inputChip`),role:`option`},r.ptm(`inputChip`)),[u(`input`,s({ref:`focusInput`,id:r.inputId,type:`text`,style:r.inputStyle,class:r.inputClass,placeholder:r.placeholder,tabindex:r.disabled?-1:r.tabindex,disabled:r.disabled,autocomplete:`off`,role:`combobox`,"aria-label":r.ariaLabel,"aria-labelledby":r.ariaLabelledby,"aria-haspopup":`listbox`,"aria-autocomplete":`list`,"aria-expanded":m.overlayVisible,"aria-controls":r.$id+`_list`,"aria-activedescendant":m.focused?h.focusedOptionId:void 0,"aria-invalid":r.invalid||void 0,onFocus:a[0]||=function(){return h.onFocus&&h.onFocus.apply(h,arguments)},onBlur:a[1]||=function(){return h.onBlur&&h.onBlur.apply(h,arguments)},onKeydown:a[2]||=function(){return h.onKeyDown&&h.onKeyDown.apply(h,arguments)},onInput:a[3]||=function(){return h.onInput&&h.onInput.apply(h,arguments)},onChange:a[4]||=function(){return h.onChange&&h.onChange.apply(h,arguments)},onPaste:a[5]||=function(){return h.onPaste&&h.onPaste.apply(h,arguments)}},Z(Z({},r.inputProps),r.ptm(`input`))),null,16,ze)],16)],16,Le)):i(``,!0),m.searching||r.loading?e(r.$slots,`loader`,{key:3,class:P(r.cx(`loader`))},function(){return[r.loader?(g(),o(`i`,s({key:0,class:[`pi-spin`,r.cx(`loader`),r.loader],"aria-hidden":`true`,"data-p-has-dropdown":r.dropdown},r.ptm(`loader`)),null,16,Be)):r.loading?(g(),f(b,s({key:1,class:r.cx(`loader`),spin:``,"aria-hidden":`true`,"data-p-has-dropdown":r.dropdown},r.ptm(`loader`)),null,16,[`class`,`data-p-has-dropdown`])):i(``,!0)]}):i(``,!0),e(r.$slots,`dropdown`,{toggleCallback:function(e){return h.onDropdownClick(e)}},function(){return[r.dropdown?(g(),o(`button`,s({key:0,ref:`dropdownButton`,type:`button`,class:[r.cx(`dropdown`),r.dropdownClass],disabled:r.disabled,"aria-haspopup":`listbox`,"aria-expanded":m.overlayVisible,"aria-controls":h.panelId,onClick:a[9]||=function(){return h.onDropdownClick&&h.onDropdownClick.apply(h,arguments)}},r.ptm(`dropdown`)),[e(r.$slots,`dropdownicon`,{class:P(r.dropdownIcon)},function(){return[(g(),f(A(r.dropdownIcon?`span`:`ChevronDown`),s({class:r.dropdownIcon},r.ptm(`dropdownIcon`)),null,16,[`class`]))]})],16,Ve)):i(``,!0)]}),r.typeahead?(g(),o(`span`,s({key:4,role:`status`,"aria-live":`polite`,class:`p-hidden-accessible`},r.ptm(`hiddenSearchResult`),{"data-p-hidden-accessible":!0}),M(h.searchResultMessageText),17)):i(``,!0),n(C,{appendTo:r.appendTo},{default:x(function(){return[n(se,s({name:`p-anchored-overlay`,onEnter:h.onOverlayEnter,onAfterEnter:h.onOverlayAfterEnter,onLeave:h.onOverlayLeave,onAfterLeave:h.onOverlayAfterLeave},r.ptm(`transition`)),{default:x(function(){return[m.overlayVisible?(g(),o(`div`,s({key:0,ref:h.overlayRef,id:h.panelId,class:[r.cx(`overlay`),r.panelClass,r.overlayClass],style:Z(Z({},r.panelStyle),r.overlayStyle),onClick:a[10]||=function(){return h.onOverlayClick&&h.onOverlayClick.apply(h,arguments)},onKeydown:a[11]||=function(){return h.onOverlayKeyDown&&h.onOverlayKeyDown.apply(h,arguments)},"data-p":h.overlayDataP},r.ptm(`overlay`)),[e(r.$slots,`header`,{value:r.d_value,suggestions:h.visibleOptions}),u(`div`,s({class:r.cx(`listContainer`),style:{"max-height":h.virtualScrollerDisabled?r.scrollHeight:``}},r.ptm(`listContainer`)),[n(S,s({ref:h.virtualScrollerRef},r.virtualScrollerOptions,{style:{height:r.scrollHeight},items:h.visibleOptions,tabindex:-1,disabled:h.virtualScrollerDisabled,pt:r.ptm(`virtualScroller`)}),c({content:x(function(n){var a=n.styleClass,c=n.contentRef,l=n.items,d=n.getItemOptions,f=n.contentStyle,_=n.itemSize;return[u(`ul`,s({ref:function(e){return h.listRef(e,c)},id:r.$id+`_list`,class:[r.cx(`list`),a],style:f,role:`listbox`,"aria-label":h.listAriaLabel},r.ptm(`list`)),[(g(!0),o(t,null,p(l,function(n,i){return g(),o(t,{key:h.getOptionRenderKey(n,h.getOptionIndex(i,d))},[h.isOptionGroup(n)?(g(),o(`li`,s({key:0,id:r.$id+`_`+h.getOptionIndex(i,d),style:{height:_?_+`px`:void 0},class:r.cx(`optionGroup`),role:`option`},{ref_for:!0},r.ptm(`optionGroup`)),[e(r.$slots,`optiongroup`,{option:n.optionGroup,index:h.getOptionIndex(i,d)},function(){return[F(M(h.getOptionGroupLabel(n.optionGroup)),1)]})],16,We)):ne((g(),o(`li`,s({key:1,id:r.$id+`_`+h.getOptionIndex(i,d),style:{height:_?_+`px`:void 0},class:r.cx(`option`,{option:n,i,getItemOptions:d}),role:`option`,"aria-label":h.getOptionLabel(n),"aria-selected":h.isSelected(n),"aria-disabled":h.isOptionDisabled(n),"aria-setsize":h.ariaSetSize,"aria-posinset":h.getAriaPosInset(h.getOptionIndex(i,d)),onClick:function(e){return h.onOptionSelect(e,n)},onMousemove:function(e){return h.onOptionMouseMove(e,h.getOptionIndex(i,d))},"data-p-selected":h.isSelected(n),"data-p-focused":m.focusedOptionIndex===h.getOptionIndex(i,d),"data-p-disabled":h.isOptionDisabled(n)},{ref_for:!0},h.getPTOptions(n,d,i,`option`)),[e(r.$slots,`option`,{option:n,index:h.getOptionIndex(i,d)},function(){return[F(M(h.getOptionLabel(n)),1)]})],16,Ge)),[[w]])],64)}),128)),r.showEmptyMessage&&(!l||l&&l.length===0)?(g(),o(`li`,s({key:0,class:r.cx(`emptyMessage`),role:`option`},r.ptm(`emptyMessage`)),[e(r.$slots,`empty`,{},function(){return[F(M(h.searchResultMessageText),1)]})],16)):i(``,!0)],16,Ue)]}),_:2},[r.$slots.loader?{name:`loader`,fn:x(function(t){var n=t.options;return[e(r.$slots,`loader`,{options:n})]}),key:`0`}:void 0]),1040,[`style`,`items`,`disabled`,`pt`])],16),e(r.$slots,`footer`,{value:r.d_value,suggestions:h.visibleOptions}),u(`span`,s({role:`status`,"aria-live":`polite`,class:`p-hidden-accessible`},r.ptm(`hiddenSelectedMessage`),{"data-p-hidden-accessible":!0}),M(h.selectedMessageText),17)],16,He)):i(``,!0)]}),_:3},16,[`onEnter`,`onAfterEnter`,`onLeave`,`onAfterLeave`])]}),_:3},8,[`appendTo`])],16,Ie)}J.render=Ke;var qe={class:`flex flex-col gap-1`},Je={key:0,class:`text-sm font-medium text-neutral-700`},Ye={key:0,class:`text-red-500`},Xe={class:`text-sm`},Ze={class:`px-3 py-2 text-sm text-neutral-400`},Qe={key:1,class:`text-xs text-red-500`},Q={__name:`AppAutocomplete`,props:{modelValue:{type:[Number,String],default:null},label:{type:String,default:``},options:{type:Array,required:!0},optionLabel:{type:String,default:`label`},optionValue:{type:String,default:`value`},searchFields:{type:Array,default:null},placeholder:{type:String,default:`Ketik untuk mencari...`},emptyMessage:{type:String,default:`Tidak ada hasil ditemukan`},error:{type:String,default:``},required:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1}},emits:[`update:modelValue`],setup(t,{emit:r}){let s=t,c=r,d=O([]),f=l({get(){return s.options.find(e=>e[s.optionValue]===s.modelValue)||null},set(e){c(`update:modelValue`,e?e[s.optionValue]:null)}}),p=l(()=>s.searchFields?.length?s.searchFields:[s.optionLabel]);function m(e){let t=e.query.toLowerCase().trim();d.value=t?s.options.filter(e=>p.value.some(n=>String(e[n]??``).toLowerCase().includes(t))):s.options.slice(0,10)}return(r,s)=>(g(),o(`div`,qe,[t.label?(g(),o(`label`,Je,[F(M(t.label)+` `,1),t.required?(g(),o(`span`,Ye,`*`)):i(``,!0)])):i(``,!0),n(S(J),{modelValue:f.value,"onUpdate:modelValue":s[0]||=e=>f.value=e,suggestions:d.value,"option-label":t.optionLabel,placeholder:t.placeholder,disabled:t.disabled,invalid:!!t.error,dropdown:``,class:`w-full`,"input-class":`w-full`,onComplete:m},{option:x(n=>[e(r.$slots,`option`,h(a(n)),()=>[u(`div`,null,[u(`p`,Xe,M(n.option[t.optionLabel]),1)])])]),empty:x(()=>[u(`div`,Ze,M(t.emptyMessage),1)]),_:3},8,[`modelValue`,`suggestions`,`option-label`,`placeholder`,`disabled`,`invalid`]),t.error?(g(),o(`span`,Qe,M(t.error),1)):i(``,!0)]))}},$e={class:`print:hidden max-w-2xl`},et={class:`card space-y-4`},tt={class:`text-sm text-slate-500`},nt={class:`flex justify-end`},rt={key:0},it={class:`flex justify-end gap-3`},$={key:0,class:`hidden print:block`},at={class:`mx-auto max-w-[480px] text-slate-900`},ot={class:`w-full border-collapse text-[13px]`},st={class:`py-0.5 align-top`},ct={class:`py-0.5 align-top`},lt={class:`py-0.5 align-top`},ut={class:`py-0.5 align-top`},dt={class:`py-0.5 align-top`},ft={__name:`BookLoanFormView`,setup(e){let t=he(),r=B(`books`),a=B(`citizens`),s=O(r??[]),c=O(a??[]),d=O(!r&&!a),f=O(!1),p=O(null),h=O(!1),_=re({citizen_id:null,book_id:null,borrowed_at:new Date().toISOString().slice(0,10),loanDurationDays:7}),y=l(()=>c.value.filter(e=>e.status===`Active`).map(e=>({label:e.full_name,value:e.citizen_id}))),b=l(()=>s.value.filter(e=>Number(e.stock)>0).map(e=>({label:`${e.title} (stok ${e.stock})`,value:e.book_id}))),C=l(()=>{let e=new Date(`${_.borrowed_at}T00:00:00`);return e.setDate(e.getDate()+Number(_.loanDurationDays||0)),e.toISOString().slice(0,10)});function w(e,t){return e.response?.data?.message??t}async function T({background:e=!1}={}){e||(d.value=!0);try{let[e,t]=await Promise.all([be(),ve()]);s.value=e,c.value=t,z(`books`,e),z(`citizens`,t)}catch(e){t.add({severity:`error`,summary:`Gagal memuat data`,detail:w(e,`Coba lagi.`),life:3500})}finally{e||(d.value=!1)}}async function E(){if(!_.citizen_id||!_.book_id||!_.borrowed_at){t.add({severity:`warn`,summary:`Data belum lengkap`,detail:`Pilih anggota, buku, dan tanggal pinjam.`,life:3e3});return}let e=c.value.find(e=>e.citizen_id===_.citizen_id),n=s.value.find(e=>e.book_id===_.book_id);f.value=!0;try{let r=await ye({citizen_id:_.citizen_id,book_id:_.book_id,borrowed_at:_.borrowed_at,due_date:C.value});p.value={...r,full_name:e?.full_name??`-`,title:n?.title??`-`,borrowed_at:_.borrowed_at,due_date:C.value},t.add({severity:`success`,summary:`Peminjaman berhasil dicatat`,life:2500}),Object.assign(_,{citizen_id:null,book_id:null,borrowed_at:new Date().toISOString().slice(0,10),loanDurationDays:7}),h.value=!0,T({background:!0})}catch(e){t.add({severity:`error`,summary:`Peminjaman gagal dicatat`,detail:w(e,`Coba lagi.`),life:3500})}finally{f.value=!1}}function D(){window.print()}return v(()=>T({background:!!(r||a)})),(e,t)=>(g(),o(`div`,null,[u(`div`,$e,[t[7]||=u(`h1`,{class:`m-0 mb-1 text-[22px] font-bold text-slate-900`},`Peminjaman Buku`,-1),t[8]||=u(`p`,{class:`mb-5 text-sm text-slate-500`},`Catat transaksi peminjaman buku perpustakaan desa.`,-1),u(`div`,et,[n(Q,{modelValue:_.citizen_id,"onUpdate:modelValue":t[0]||=e=>_.citizen_id=e,options:y.value,label:`Anggota`,placeholder:`Pilih anggota`,disabled:d.value},null,8,[`modelValue`,`options`,`disabled`]),n(Q,{modelValue:_.book_id,"onUpdate:modelValue":t[1]||=e=>_.book_id=e,options:b.value,label:`Buku`,placeholder:`Pilih buku`,disabled:d.value},null,8,[`modelValue`,`options`,`disabled`]),n(V,{modelValue:_.borrowed_at,"onUpdate:modelValue":t[2]||=e=>_.borrowed_at=e,type:`date`,label:`Tanggal Pinjam`},null,8,[`modelValue`]),n(V,{modelValue:_.loanDurationDays,"onUpdate:modelValue":t[3]||=e=>_.loanDurationDays=e,modelModifiers:{number:!0},type:`number`,min:`1`,label:`Lama Pinjam (hari)`},null,8,[`modelValue`]),u(`p`,tt,[t[6]||=F(`Jatuh tempo: `,-1),u(`strong`,null,M(C.value),1)]),u(`div`,nt,[n(H,{label:`Simpan Peminjaman`,variant:`primary`,loading:f.value,onClick:E},null,8,[`loading`])])])]),n(S(ge),{visible:h.value,"onUpdate:visible":t[5]||=e=>h.value=e,modal:``,header:`Bukti Peminjaman Buku`,style:{width:`32rem`}},{default:x(()=>[p.value?(g(),o(`div`,rt,[u(`p`,null,`No. Peminjaman: `+M(p.value.loan_id),1),u(`p`,null,`Anggota: `+M(p.value.full_name),1),u(`p`,null,`Buku: `+M(p.value.title),1),u(`p`,null,`Tanggal Pinjam: `+M(p.value.borrowed_at),1),u(`p`,null,`Jatuh Tempo: `+M(p.value.due_date),1),u(`div`,it,[n(H,{label:`Tutup`,variant:`outline`,onClick:t[4]||=e=>h.value=!1}),n(H,{label:`Cetak Bukti`,icon:`pi pi-print`,variant:`primary`,onClick:D})])])):i(``,!0)]),_:1},8,[`visible`]),p.value?(g(),o(`div`,$,[u(`div`,at,[t[19]||=m(`<div class="mb-5 text-center"><p class="m-0 text-base font-bold uppercase tracking-wide">Perpustakaan Kalurahan Bimomartani</p><p class="mt-0.5 text-[11px] text-slate-600">Kalurahan Bimomartani, Kec. Ngemplak, Kab. Sleman, Daerah Istimewa Yogyakarta</p><div class="mt-2 border-b-2 border-slate-900"></div></div><h2 class="mb-5 text-center text-[15px] font-bold uppercase underline">Bukti Peminjaman Buku</h2>`,2),u(`table`,ot,[u(`tbody`,null,[u(`tr`,null,[t[9]||=u(`td`,{class:`w-[140px] py-0.5 align-top`},`No. Peminjaman`,-1),t[10]||=u(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),u(`td`,st,M(p.value.loan_id),1)]),u(`tr`,null,[t[11]||=u(`td`,{class:`w-[140px] py-0.5 align-top`},`Nama Anggota`,-1),t[12]||=u(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),u(`td`,ct,M(p.value.full_name),1)]),u(`tr`,null,[t[13]||=u(`td`,{class:`w-[140px] py-0.5 align-top`},`Judul Buku`,-1),t[14]||=u(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),u(`td`,lt,M(p.value.title),1)]),u(`tr`,null,[t[15]||=u(`td`,{class:`w-[140px] py-0.5 align-top`},`Tanggal Pinjam`,-1),t[16]||=u(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),u(`td`,ut,M(p.value.borrowed_at),1)]),u(`tr`,null,[t[17]||=u(`td`,{class:`w-[140px] py-0.5 align-top`},`Jatuh Tempo`,-1),t[18]||=u(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),u(`td`,dt,M(p.value.due_date),1)])])]),t[20]||=u(`div`,{class:`mt-10 pr-6 text-right text-[13px]`},[u(`p`,null,`Petugas Perpustakaan`),u(`p`,{class:`mt-16`},`( ...................... )`)],-1)])])):i(``,!0)]))}};export{ft as default};