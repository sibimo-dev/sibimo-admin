import{At as e,Dt as t,Et as n,Fn as r,In as i,Jt as a,Kt as o,Lt as s,Mt as c,N as l,Nt as u,Ot as d,Qt as f,R as p,Rn as m,S as h,Tt as g,Vt as _,Wt as v,Xt as y,Yt as b,Zt as x,a as S,an as C,b as w,dt as T,et as E,fn as D,g as O,ht as k,in as A,jt as ee,lt as te,m as j,mn as M,n as ne,o as re,pt as N,q as ie,u as P,vt as F,wt as I,xt as L,yn as R}from"./button-BfjT7ki2.js";import{t as ae}from"./runtime-dom.esm-bundler-Z2KByX15.js";import{n as oe,r as z,t as se}from"./portal-nc7NV9AW.js";import{A as ce,C as le,D as ue,L as de,M as fe,O as pe,k as me,n as B,t as V,w as he,y as ge}from"./index-4wnXBkEE.js";import{t as H}from"./AppInput-BvpOGogx.js";import{t as U}from"./AppButton-CGjIjRym.js";import{i as _e}from"./citizen.service-0fjiHCus.js";import{r as ve,s as ye}from"./library.service-Des8YycD.js";var be=P.extend({name:`chip`,style:`
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
`,classes:{root:`p-chip p-component`,image:`p-chip-image`,icon:`p-chip-icon`,label:`p-chip-label`,removeIcon:`p-chip-remove-icon`}}),W={name:`Chip`,extends:{name:`BaseChip`,extends:S,props:{label:{type:[String,Number],default:null},icon:{type:String,default:null},image:{type:String,default:null},removable:{type:Boolean,default:!1},removeIcon:{type:String,default:void 0}},style:be,provide:function(){return{$pcChip:this,$parentInstance:this}}},inheritAttrs:!1,emits:[`remove`],data:function(){return{visible:!0}},methods:{onKeydown:function(e){(e.key===`Enter`||e.key===`Backspace`)&&this.close(e)},close:function(e){this.visible=!1,this.$emit(`remove`,e)}},computed:{dataP:function(){return j({removable:this.removable})}},components:{TimesCircle:ue}},xe=[`data-p`],Se=[`src`];function Ce(e,r,i,a,s,c){return s.visible?(o(),d(`div`,_({key:0,class:e.cx(`root`)},e.ptmi(`root`),{"data-p":c.dataP}),[b(e.$slots,`default`,{},function(){return[e.image?(o(),d(`img`,_({key:0,src:e.image},e.ptm(`image`),{class:e.cx(`image`)}),null,16,Se)):e.$slots.icon?(o(),n(f(e.$slots.icon),_({key:1,class:e.cx(`icon`)},e.ptm(`icon`)),null,16,[`class`])):e.icon?(o(),d(`span`,_({key:2,class:[e.cx(`icon`),e.icon]},e.ptm(`icon`)),null,16)):t(``,!0),e.label===null?t(``,!0):(o(),d(`div`,_({key:3,class:e.cx(`label`)},e.ptm(`label`)),m(e.label),17))]}),e.removable?b(e.$slots,`removeicon`,{key:0,removeCallback:c.close,keydownCallback:c.onKeydown},function(){return[(o(),n(f(e.removeIcon?`span`:`TimesCircle`),_({class:[e.cx(`removeIcon`),e.removeIcon],tabindex:`0`,onClick:c.close,onKeydown:c.onKeydown},e.ptm(`removeIcon`)),null,16,[`class`,`onClick`,`onKeydown`]))]}):t(``,!0)],16,xe)):t(``,!0)}W.render=Ce;var we=P.extend({name:`autocomplete`,style:`
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
`,classes:{root:function(e){var t=e.instance;return[`p-autocomplete p-component p-inputwrapper`,{"p-invalid":t.$invalid,"p-focus":t.focused,"p-inputwrapper-filled":t.$filled||N(t.inputValue),"p-inputwrapper-focus":t.focused,"p-autocomplete-open":t.overlayVisible,"p-autocomplete-fluid":t.$fluid}]},pcInputText:`p-autocomplete-input`,inputMultiple:function(e){var t=e.instance,n=e.props;return[`p-autocomplete-input-multiple`,{"p-variant-filled":t.$variant===`filled`,"p-disabled":n.disabled}]},clearIcon:`p-autocomplete-clear-icon`,chipItem:function(e){var t=e.instance,n=e.i;return[`p-autocomplete-chip-item`,{"p-focus":t.focusedMultipleOptionIndex===n}]},pcChip:`p-autocomplete-chip`,chipIcon:`p-autocomplete-chip-icon`,inputChip:`p-autocomplete-input-chip`,loader:`p-autocomplete-loader`,dropdown:`p-autocomplete-dropdown`,overlay:`p-autocomplete-overlay p-component`,listContainer:`p-autocomplete-list-container`,list:`p-autocomplete-list`,optionGroup:`p-autocomplete-option-group`,option:function(e){var t=e.instance,n=e.option,r=e.i,i=e.getItemOptions;return[`p-autocomplete-option`,{"p-autocomplete-option-selected":t.isSelected(n),"p-focus":t.focusedOptionIndex===t.getOptionIndex(r,i),"p-disabled":t.isOptionDisabled(n)}]},emptyMessage:`p-autocomplete-empty-message`},inlineStyles:{root:{position:`relative`}}}),Te={name:`BaseAutoComplete`,extends:he,props:{suggestions:{type:Array,default:null},optionLabel:null,optionDisabled:null,optionGroupLabel:null,optionGroupChildren:null,scrollHeight:{type:String,default:`14rem`},dropdown:{type:Boolean,default:!1},dropdownMode:{type:String,default:`blank`},multiple:{type:Boolean,default:!1},loading:{type:Boolean,default:!1},placeholder:{type:String,default:null},dataKey:{type:String,default:null},minLength:{type:Number,default:1},delay:{type:Number,default:300},appendTo:{type:[String,Object],default:`body`},forceSelection:{type:Boolean,default:!1},completeOnFocus:{type:Boolean,default:!1},showClear:{type:Boolean,default:!1},inputId:{type:String,default:null},inputStyle:{type:Object,default:null},inputClass:{type:[String,Object],default:null},inputProps:{type:null,default:null},panelStyle:{type:Object,default:null},panelClass:{type:[String,Object],default:null},overlayStyle:{type:Object,default:null},overlayClass:{type:[String,Object],default:null},dropdownIcon:{type:String,default:null},dropdownClass:{type:[String,Object],default:null},loader:{type:String,default:null},chipIcon:{type:String,default:null},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},selectOnFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},searchLocale:{type:String,default:void 0},searchMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptySearchMessage:{type:String,default:null},showEmptyMessage:{type:Boolean,default:!0},tabindex:{type:Number,default:0},typeahead:{type:Boolean,default:!0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:we,provide:function(){return{$pcAutoComplete:this,$parentInstance:this}}};function G(e,t,n){return(t=Ee(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Ee(e){var t=De(e,`string`);return K(t)==`symbol`?t:t+``}function De(e,t){if(K(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(K(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function K(e){"@babel/helpers - typeof";return K=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},K(e)}function q(e){return je(e)||Ae(e)||ke(e)||Oe()}function Oe(){throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ke(e,t){if(e){if(typeof e==`string`)return J(e,t);var n={}.toString.call(e).slice(8,-1);return n===`Object`&&e.constructor&&(n=e.constructor.name),n===`Map`||n===`Set`?Array.from(e):n===`Arguments`||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?J(e,t):void 0}}function Ae(e){if(typeof Symbol<`u`&&e[Symbol.iterator]!=null||e[`@@iterator`]!=null)return Array.from(e)}function je(e){if(Array.isArray(e))return J(e)}function J(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,r=Array(t);n<t;n++)r[n]=e[n];return r}var Y={name:`AutoComplete`,extends:Te,inheritAttrs:!1,emits:[`change`,`focus`,`blur`,`option-select`,`option-unselect`,`dropdown-click`,`clear`,`complete`,`before-show`,`before-hide`,`show`,`hide`,`keydown`,`paste`],inject:{$pcFluid:{default:null}},outsideClickListener:null,resizeListener:null,scrollHandler:null,overlay:null,virtualScroller:null,searchTimeout:null,dirty:!1,startRangeIndex:-1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,focusedMultipleOptionIndex:-1,overlayVisible:!1,searching:!1}},watch:{suggestions:function(){this.searching&&(this.show(),this.focusedOptionIndex=this.overlayVisible&&this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1,this.searching=!1,!this.showEmptyMessage&&this.visibleOptions.length===0&&this.hide()),this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel()},updated:function(){this.overlayVisible&&this.alignOverlay()},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.scrollHandler&&=(this.scrollHandler.destroy(),null),this.overlay&&=(z.clear(this.overlay),null)},methods:{getOptionIndex:function(e,t){return this.virtualScrollerDisabled?e:t&&t(e).index},getOptionLabel:function(e){return this.optionLabel?T(e,this.optionLabel):e},getOptionValue:function(e){return e},getOptionRenderKey:function(e,t){return(this.dataKey?T(e,this.dataKey):this.getOptionLabel(e))+`_`+t},getPTOptions:function(e,t,n,r){return this.ptm(r,{context:{option:e,index:n,selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(n,t),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.optionDisabled?T(e,this.optionDisabled):!1},isOptionGroup:function(e){return this.optionGroupLabel&&e.optionGroup&&e.group},getOptionGroupLabel:function(e){return T(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return T(e,this.optionGroupChildren)},getAriaPosInset:function(e){var t=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(e){return t.isOptionGroup(e)}).length:e)+1},show:function(e){this.$emit(`before-show`),this.dirty=!0,this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex===-1?this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1:this.focusedOptionIndex,e&&w(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},hide:function(e){var t=this,n=function(){t.$emit(`before-hide`),t.dirty=e,t.overlayVisible=!1,t.clicked=!1,t.focusedOptionIndex=-1,e&&w(t.multiple?t.$refs.focusInput:t.$refs.focusInput?.$el)};setTimeout(function(){n()},0)},onFocus:function(e){this.disabled||(!this.dirty&&this.completeOnFocus&&this.search(e,e.target.value,`focus`),this.dirty=!0,this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex===-1?this.overlayVisible&&this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1:this.focusedOptionIndex,this.scrollInView(this.focusedOptionIndex)),this.$emit(`focus`,e))},onBlur:function(e){var t,n;this.dirty=!1,this.focused=!1,this.focusedOptionIndex=-1,this.$emit(`blur`,e),(t=(n=this.formField).onBlur)==null||t.call(n)},onPaste:function(e){this.$emit(`paste`,e)},onKeyDown:function(e){if(this.disabled){e.preventDefault();return}switch(this.$emit(`keydown`,e),e.code){case`ArrowDown`:this.onArrowDownKey(e);break;case`ArrowUp`:this.onArrowUpKey(e);break;case`ArrowLeft`:this.onArrowLeftKey(e);break;case`ArrowRight`:this.onArrowRightKey(e);break;case`Home`:this.onHomeKey(e);break;case`End`:this.onEndKey(e);break;case`PageDown`:this.onPageDownKey(e);break;case`PageUp`:this.onPageUpKey(e);break;case`Enter`:case`NumpadEnter`:this.onEnterKey(e);break;case`Space`:this.onSpaceKey(e);break;case`Escape`:this.onEscapeKey(e),this.overlayVisible&&e.stopPropagation();break;case`Tab`:this.onTabKey(e);break;case`ShiftLeft`:case`ShiftRight`:this.onShiftKey(e);break;case`Backspace`:this.onBackspaceKey(e);break}this.clicked=!1},onInput:function(e){var t=this;if(this.typeahead){this.searchTimeout&&clearTimeout(this.searchTimeout);var n=e.target.value;this.multiple||this.updateModel(e,n),n.length===0?(this.searching=!1,this.hide(),this.$emit(`clear`)):n.length>=this.minLength?(this.focusedOptionIndex=-1,this.searchTimeout=setTimeout(function(){t.search(e,n,`input`)},this.delay)):(this.searching=!1,this.hide())}},onChange:function(e){var t=this;if(this.forceSelection){var n=!1;if(this.visibleOptions&&!this.multiple){var r,i=this.multiple?this.$refs.focusInput.value:(r=this.$refs.focusInput)==null||(r=r.$el)==null?void 0:r.value,a=this.visibleOptions.find(function(e){return t.isOptionMatched(e,i||``)});a!==void 0&&(n=!0,!this.isSelected(a)&&this.onOptionSelect(e,a))}if(!n){if(this.multiple)this.$refs.focusInput.value=``;else{var o=this.$refs.focusInput?.$el;o&&(o.value=``)}this.$emit(`clear`),!this.multiple&&this.updateModel(e,null)}}},onMultipleContainerFocus:function(){this.disabled||(this.focused=!0)},onMultipleContainerBlur:function(){this.focusedMultipleOptionIndex=-1,this.focused=!1},onMultipleContainerKeyDown:function(e){if(this.disabled){e.preventDefault();return}switch(e.code){case`ArrowLeft`:this.onArrowLeftKeyOnMultiple(e);break;case`ArrowRight`:this.onArrowRightKeyOnMultiple(e);break;case`Backspace`:this.onBackspaceKeyOnMultiple(e);break}},onContainerClick:function(e){this.clicked=!0,!(this.disabled||this.searching||this.loading||this.isDropdownClicked(e))&&(!this.overlay||!this.overlay.contains(e.target))&&w(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},onDropdownClick:function(e){var t=void 0;if(this.overlayVisible)this.hide(!0);else{var n=this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el;w(n),t=n.value,this.dropdownMode===`blank`?this.search(e,``,`dropdown`):this.dropdownMode===`current`&&this.search(e,t,`dropdown`)}this.$emit(`dropdown-click`,{originalEvent:e,query:t})},onOptionSelect:function(e,t){var n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!0,r=this.getOptionValue(t);this.multiple?(this.$refs.focusInput.value=``,this.isSelected(t)||this.updateModel(e,[].concat(q(this.d_value||[]),[r]))):this.updateModel(e,r),this.$emit(`option-select`,{originalEvent:e,value:t}),n&&this.hide(!0)},onOptionMouseMove:function(e,t){this.focusOnHover&&this.changeFocusedOptionIndex(e,t)},onOptionSelectRange:function(e){var t=this,n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:-1,r=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1;if(n===-1&&(n=this.findNearestSelectedOptionIndex(r,!0)),r===-1&&(r=this.findNearestSelectedOptionIndex(n)),n!==-1&&r!==-1){var i=Math.min(n,r),a=Math.max(n,r),o=this.visibleOptions.slice(i,a+1).filter(function(e){return t.isValidOption(e)}).filter(function(e){return!t.isSelected(e)}).map(function(e){return t.getOptionValue(e)});this.updateModel(e,[].concat(q(this.d_value||[]),q(o)))}},onClearClick:function(e){this.updateModel(e,null),this.overlayVisible&&this.hide(!0),this.$emit(`clear`)},onOverlayClick:function(e){me.emit(`overlay-click`,{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){switch(e.code){case`Escape`:this.onEscapeKey(e);break}},onArrowDownKey:function(e){if(this.overlayVisible){var t=this.focusedOptionIndex===-1?this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex():this.findNextOptionIndex(this.focusedOptionIndex);this.multiple&&e.shiftKey&&this.onOptionSelectRange(e,this.startRangeIndex,t),this.changeFocusedOptionIndex(e,t),e.preventDefault()}},onArrowUpKey:function(e){if(this.overlayVisible)if(e.altKey)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var t=this.focusedOptionIndex===-1?this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex():this.findPrevOptionIndex(this.focusedOptionIndex);this.multiple&&e.shiftKey&&this.onOptionSelectRange(e,t,this.startRangeIndex),this.changeFocusedOptionIndex(e,t),e.preventDefault()}},onArrowLeftKey:function(e){var t=e.currentTarget;this.focusedOptionIndex=-1,this.multiple&&(k(t.value)&&this.$filled?(w(this.$refs.multiContainer),this.focusedMultipleOptionIndex=this.d_value.length):e.stopPropagation())},onArrowRightKey:function(e){this.focusedOptionIndex=-1,this.multiple&&e.stopPropagation()},onHomeKey:function(e){var t=e.currentTarget,n=t.value.length,r=e.metaKey||e.ctrlKey,i=this.findFirstOptionIndex();this.multiple&&e.shiftKey&&r&&this.onOptionSelectRange(e,i,this.startRangeIndex),t.setSelectionRange(0,e.shiftKey?n:0),this.focusedOptionIndex=-1,e.preventDefault()},onEndKey:function(e){var t=e.currentTarget,n=t.value.length,r=e.metaKey||e.ctrlKey,i=this.findLastOptionIndex();this.multiple&&e.shiftKey&&r&&this.onOptionSelectRange(e,this.startRangeIndex,i),t.setSelectionRange(e.shiftKey?0:n,n),this.focusedOptionIndex=-1,e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.typeahead?this.overlayVisible?(this.focusedOptionIndex!==-1&&(this.multiple&&e.shiftKey?this.onOptionSelectRange(e,this.focusedOptionIndex):this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),e.preventDefault()),this.hide()):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)):this.multiple&&e.target.value.trim()&&(this.updateModel(e,[].concat(q(this.d_value||[]),[e.target.value.trim()])),this.$refs.focusInput.value=``,e.preventDefault())},onSpaceKey:function(e){!this.autoOptionFocus&&this.focusedOptionIndex!==-1&&this.onEnterKey(e)},onEscapeKey:function(e){this.overlayVisible&&this.hide(!0),e.preventDefault()},onTabKey:function(e){this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide()},onShiftKey:function(){this.startRangeIndex=this.focusedOptionIndex},onBackspaceKey:function(e){if(this.multiple){if(N(this.d_value)&&!this.$refs.focusInput.value){var t=this.d_value[this.d_value.length-1],n=this.d_value.slice(0,-1);this.writeValue(n,e),this.$emit(`option-unselect`,{originalEvent:e,value:t})}e.stopPropagation()}},onArrowLeftKeyOnMultiple:function(){this.focusedMultipleOptionIndex=this.focusedMultipleOptionIndex<1?0:this.focusedMultipleOptionIndex-1},onArrowRightKeyOnMultiple:function(){this.focusedMultipleOptionIndex++,this.focusedMultipleOptionIndex>this.d_value.length-1&&(this.focusedMultipleOptionIndex=-1,w(this.$refs.focusInput))},onBackspaceKeyOnMultiple:function(e){this.focusedMultipleOptionIndex!==-1&&this.removeOption(e,this.focusedMultipleOptionIndex)},onOverlayEnter:function(e){z.set(`overlay`,e,this.$primevue.config.zIndex.overlay),h(e,{position:`absolute`,top:`0`}),this.alignOverlay(),this.$attrSelector&&e.setAttribute(this.$attrSelector,``)},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit(`show`)},onOverlayLeave:function(e){e.style.pointerEvents=`none`,this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.$emit(`hide`),this.overlay=null},onOverlayAfterLeave:function(e){z.clear(e)},alignOverlay:function(){var e,t=this.$refs.container,n=t?.parentElement,r=(n==null||(e=n.dataset)==null?void 0:e.pcName)===`inputtags`?n:t;this.appendTo===`self`?l(this.overlay,r):(this.overlay.style.minWidth=O(r)+`px`,E(this.overlay,r))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(t){e.overlayVisible&&e.overlay&&e.isOutsideClicked(t)&&e.hide()},document.addEventListener(`click`,this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&=(document.removeEventListener(`click`,this.outsideClickListener,!0),null)},bindScrollListener:function(){var e=this;this.scrollHandler||=new ce(this.$refs.container,function(){e.overlayVisible&&e.hide()}),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!ie()&&e.hide()},window.addEventListener(`resize`,this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&=(window.removeEventListener(`resize`,this.resizeListener),null)},isOutsideClicked:function(e){return!this.overlay.contains(e.target)&&!this.isInputClicked(e)&&!this.isDropdownClicked(e)},isInputClicked:function(e){var t,n=this.$refs.container,r=n?.parentElement,i=(r==null||(t=r.dataset)==null?void 0:t.pcName)===`inputtags`?r:n;return i?e.target===i||i.contains(e.target):!1},isDropdownClicked:function(e){return this.$refs.dropdownButton?e.target===this.$refs.dropdownButton||this.$refs.dropdownButton.contains(e.target):!1},isOptionMatched:function(e,t){return this.isValidOption(e)&&this.getOptionLabel(e)?.toLocaleLowerCase(this.searchLocale)===t.toLocaleLowerCase(this.searchLocale)},isValidOption:function(e){return N(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isEquals:function(e,t){return te(e,t,this.equalityKey)},isSelected:function(e){var t=this,n=this.getOptionValue(e);return this.multiple?(this.d_value||[]).some(function(e){return t.isEquals(e,n)}):this.isEquals(this.d_value,this.getOptionValue(e))},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(t){return e.isValidOption(t)})},findLastOptionIndex:function(){var e=this;return F(this.visibleOptions,function(t){return e.isValidOption(t)})},findNextOptionIndex:function(e){var t=this,n=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(e){return t.isValidOption(e)}):-1;return n>-1?n+e+1:e},findPrevOptionIndex:function(e){var t=this,n=e>0?F(this.visibleOptions.slice(0,e),function(e){return t.isValidOption(e)}):-1;return n>-1?n:e},findSelectedOptionIndex:function(){var e=this;return this.$filled?this.visibleOptions.findIndex(function(t){return e.isValidSelectedOption(t)}):-1},findFirstFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},search:function(e,t,n){var r=this;t!=null&&(n===`input`&&t.trim().length===0||(this.searching=!0,this.$emit(`complete`,{originalEvent:e,query:t}),requestAnimationFrame(function(){requestAnimationFrame(function(){r.searching&&(r.searching=!1,(r.showEmptyMessage||r.visibleOptions.length>0)&&(r.show(),r.focusedOptionIndex=r.overlayVisible&&r.autoOptionFocus?r.findFirstFocusedOptionIndex():-1))})})))},removeOption:function(e,t){var n=this,r=this.d_value[t],i=this.d_value.filter(function(e,n){return n!==t}).map(function(e){return n.getOptionValue(e)});this.updateModel(e,i),this.$emit(`option-unselect`,{originalEvent:e,value:r}),this.dirty=!0,w(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},changeFocusedOptionIndex:function(e,t){this.focusedOptionIndex!==t&&(this.focusedOptionIndex=t,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[t],!1))},scrollInView:function(){var e=this,t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var n=t===-1?e.focusedOptionId:`${e.$id}_${t}`,r=p(e.list,`li[id="${n}"]`);r?r.scrollIntoView&&r.scrollIntoView({block:`nearest`,inline:`start`}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(t===-1?e.focusedOptionIndex:t)})},autoUpdateModel:function(){this.selectOnFocus&&this.autoOptionFocus&&!this.$filled&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex(),this.onOptionSelect(null,this.visibleOptions[this.focusedOptionIndex],!1))},updateModel:function(e,t){this.writeValue(t,e),this.$emit(`change`,{originalEvent:e,value:t})},flatOptions:function(e){var t=this;return(e||[]).reduce(function(e,n,r){e.push({optionGroup:n,group:!0,index:r});var i=t.getOptionGroupChildren(n);return i&&i.forEach(function(t){return e.push(t)}),e},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,t){this.list=e,t&&t(e)},virtualScrollerRef:function(e){this.virtualScroller=e},findNextSelectedOptionIndex:function(e){var t=this,n=this.$filled&&e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(e){return t.isValidSelectedOption(e)}):-1;return n>-1?n+e+1:-1},findPrevSelectedOptionIndex:function(e){var t=this,n=this.$filled&&e>0?F(this.visibleOptions.slice(0,e),function(e){return t.isValidSelectedOption(e)}):-1;return n>-1?n:-1},findNearestSelectedOptionIndex:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1],n=-1;return this.$filled&&(t?(n=this.findPrevSelectedOptionIndex(e),n=n===-1?this.findNextSelectedOptionIndex(e):n):(n=this.findNextSelectedOptionIndex(e),n=n===-1?this.findPrevSelectedOptionIndex(e):n)),n>-1?n:e}},computed:{visibleOptions:function(){return this.optionGroupLabel?this.flatOptions(this.suggestions):this.suggestions||[]},inputValue:function(){return this.$filled?K(this.d_value)===`object`?this.getOptionLabel(this.d_value)??this.d_value:this.d_value:``},equalityKey:function(){return this.dataKey},searchResultMessageText:function(){return N(this.visibleOptions)&&this.overlayVisible?this.searchMessageText.replaceAll(`{0}`,this.visibleOptions.length):this.emptySearchMessageText},searchMessageText:function(){return this.searchMessage||this.$primevue.config.locale.searchMessage||``},emptySearchMessageText:function(){return this.emptySearchMessage||this.$primevue.config.locale.emptySearchMessage||``},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||``},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||``},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll(`{0}`,this.multiple?this.d_value.length:`1`):this.emptySelectionMessageText},listAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.listLabel:void 0},focusedOptionId:function(){return this.focusedOptionIndex===-1?null:`${this.$id}_${this.focusedOptionIndex}`},focusedMultipleOptionId:function(){return this.focusedMultipleOptionIndex===-1?null:`${this.$id}_multiple_option_${this.focusedMultipleOptionIndex}`},isClearIconVisible:function(){return this.showClear&&this.$filled&&!this.disabled&&!this.loading},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(t){return!e.isOptionGroup(t)}).length},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},panelId:function(){return this.$id+`_panel`},containerDataP:function(){return j({fluid:this.$fluid})},overlayDataP:function(){return j(G({},`portal-`+this.appendTo,`portal-`+this.appendTo))},inputMultipleDataP:function(){return j(G({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant===`filled`,empty:!this.$filled},this.size,this.size))}},components:{InputText:le,VirtualScroller:ge,Portal:se,Chip:W,ChevronDown:fe,Spinner:re,Times:oe},directives:{ripple:ne}};function X(e){"@babel/helpers - typeof";return X=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},X(e)}function Z(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function Q(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]==null?{}:arguments[t];t%2?Z(Object(n),!0).forEach(function(t){Me(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Z(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function Me(e,t,n){return(t=Ne(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Ne(e){var t=Pe(e,`string`);return X(t)==`symbol`?t:t+``}function Pe(e,t){if(X(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(X(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}var Fe=[`data-p`],Ie=[`aria-activedescendant`,`data-p-has-dropdown`,`data-p`],Le=[`id`,`aria-label`,`aria-setsize`,`aria-posinset`],Re=[`id`,`placeholder`,`tabindex`,`disabled`,`aria-label`,`aria-labelledby`,`aria-expanded`,`aria-controls`,`aria-activedescendant`,`aria-invalid`],ze=[`data-p-has-dropdown`],Be=[`disabled`,`aria-expanded`,`aria-controls`],Ve=[`id`,`data-p`],He=[`id`,`aria-label`],Ue=[`id`],We=[`id`,`aria-label`,`aria-selected`,`aria-disabled`,`aria-setsize`,`aria-posinset`,`onClick`,`onMousemove`,`data-p-selected`,`data-p-focused`,`data-p-disabled`];function Ge(i,s,l,p,h,v){var S=y(`InputText`),w=y(`Times`),T=y(`Chip`),E=y(`Spinner`),D=y(`VirtualScroller`),O=y(`Portal`),k=x(`ripple`);return o(),d(`div`,_({ref:`container`,class:i.cx(`root`),style:i.sx(`root`),onClick:s[12]||=function(){return v.onContainerClick&&v.onContainerClick.apply(v,arguments)},"data-p":v.containerDataP},i.ptmi(`root`)),[i.multiple?t(``,!0):(o(),n(S,_({key:0,ref:`focusInput`,id:i.inputId,type:`text`,name:i.$formName,formControl:{novalidate:!0},class:[i.cx(`pcInputText`),i.inputClass],style:i.inputStyle,defaultValue:v.inputValue,placeholder:i.placeholder,tabindex:i.disabled?-1:i.tabindex,fluid:i.$fluid,disabled:i.disabled,size:i.size,invalid:i.$invalid,variant:i.variant,autocomplete:`off`,role:`combobox`,"aria-label":i.ariaLabel,"aria-labelledby":i.ariaLabelledby,"aria-haspopup":`listbox`,"aria-autocomplete":`list`,"aria-expanded":h.overlayVisible,"aria-controls":h.overlayVisible?v.panelId:void 0,"aria-activedescendant":h.focused?v.focusedOptionId:void 0,onFocus:v.onFocus,onBlur:v.onBlur,onKeydown:v.onKeyDown,onInput:v.onInput,onChange:v.onChange,onPaste:v.onPaste,unstyled:i.unstyled,"data-p-has-dropdown":i.dropdown},i.inputProps,{pt:i.ptm(`pcInputText`)}),null,16,`id.name.class.style.defaultValue.placeholder.tabindex.fluid.disabled.size.invalid.variant.aria-label.aria-labelledby.aria-expanded.aria-controls.aria-activedescendant.onFocus.onBlur.onKeydown.onInput.onChange.onPaste.unstyled.data-p-has-dropdown.pt`.split(`.`))),v.isClearIconVisible?b(i.$slots,`clearicon`,{key:1,class:r(i.cx(`clearIcon`)),clearCallback:v.onClearClick},function(){return[u(w,_({class:[i.cx(`clearIcon`)],onClick:v.onClearClick},i.ptm(`clearIcon`)),null,16,[`class`,`onClick`])]}):t(``,!0),i.multiple?(o(),d(`ul`,_({key:2,ref:`multiContainer`,class:i.cx(`inputMultiple`),tabindex:`-1`,role:`listbox`,"aria-orientation":`horizontal`,"aria-activedescendant":h.focused?v.focusedMultipleOptionId:void 0,onFocus:s[6]||=function(){return v.onMultipleContainerFocus&&v.onMultipleContainerFocus.apply(v,arguments)},onBlur:s[7]||=function(){return v.onMultipleContainerBlur&&v.onMultipleContainerBlur.apply(v,arguments)},onKeydown:s[8]||=function(){return v.onMultipleContainerKeyDown&&v.onMultipleContainerKeyDown.apply(v,arguments)},"data-p-has-dropdown":i.dropdown,"data-p":v.inputMultipleDataP},i.ptm(`inputMultiple`)),[(o(!0),d(L,null,a(i.d_value,function(e,t){return o(),d(`li`,_({key:`${t}_${v.getOptionLabel(e)}`,id:i.$id+`_multiple_option_`+t,class:i.cx(`chipItem`,{i:t}),role:`option`,"aria-label":v.getOptionLabel(e),"aria-selected":!0,"aria-setsize":i.d_value.length,"aria-posinset":t+1},{ref_for:!0},i.ptm(`chipItem`)),[b(i.$slots,`chip`,_({class:i.cx(`pcChip`),value:e,index:t,removeCallback:function(e){return v.removeOption(e,t)}},{ref_for:!0},i.ptm(`pcChip`)),function(){return[u(T,{class:r(i.cx(`pcChip`)),label:v.getOptionLabel(e),removeIcon:i.chipIcon,removable:``,unstyled:i.unstyled,onRemove:function(e){return v.removeOption(e,t)},"data-p-focused":h.focusedMultipleOptionIndex===t,pt:i.ptm(`pcChip`)},{removeicon:A(function(){return[b(i.$slots,`chipicon`,{class:r(i.cx(`chipIcon`)),index:t,removeCallback:function(e){return v.removeOption(e,t)}})]}),_:2},1032,[`class`,`label`,`removeIcon`,`unstyled`,`onRemove`,`data-p-focused`,`pt`])]})],16,Le)}),128)),g(`li`,_({class:i.cx(`inputChip`),role:`option`},i.ptm(`inputChip`)),[g(`input`,_({ref:`focusInput`,id:i.inputId,type:`text`,style:i.inputStyle,class:i.inputClass,placeholder:i.placeholder,tabindex:i.disabled?-1:i.tabindex,disabled:i.disabled,autocomplete:`off`,role:`combobox`,"aria-label":i.ariaLabel,"aria-labelledby":i.ariaLabelledby,"aria-haspopup":`listbox`,"aria-autocomplete":`list`,"aria-expanded":h.overlayVisible,"aria-controls":i.$id+`_list`,"aria-activedescendant":h.focused?v.focusedOptionId:void 0,"aria-invalid":i.invalid||void 0,onFocus:s[0]||=function(){return v.onFocus&&v.onFocus.apply(v,arguments)},onBlur:s[1]||=function(){return v.onBlur&&v.onBlur.apply(v,arguments)},onKeydown:s[2]||=function(){return v.onKeyDown&&v.onKeyDown.apply(v,arguments)},onInput:s[3]||=function(){return v.onInput&&v.onInput.apply(v,arguments)},onChange:s[4]||=function(){return v.onChange&&v.onChange.apply(v,arguments)},onPaste:s[5]||=function(){return v.onPaste&&v.onPaste.apply(v,arguments)}},Q(Q({},i.inputProps),i.ptm(`input`))),null,16,Re)],16)],16,Ie)):t(``,!0),h.searching||i.loading?b(i.$slots,`loader`,{key:3,class:r(i.cx(`loader`))},function(){return[i.loader?(o(),d(`i`,_({key:0,class:[`pi-spin`,i.cx(`loader`),i.loader],"aria-hidden":`true`,"data-p-has-dropdown":i.dropdown},i.ptm(`loader`)),null,16,ze)):i.loading?(o(),n(E,_({key:1,class:i.cx(`loader`),spin:``,"aria-hidden":`true`,"data-p-has-dropdown":i.dropdown},i.ptm(`loader`)),null,16,[`class`,`data-p-has-dropdown`])):t(``,!0)]}):t(``,!0),b(i.$slots,`dropdown`,{toggleCallback:function(e){return v.onDropdownClick(e)}},function(){return[i.dropdown?(o(),d(`button`,_({key:0,ref:`dropdownButton`,type:`button`,class:[i.cx(`dropdown`),i.dropdownClass],disabled:i.disabled,"aria-haspopup":`listbox`,"aria-expanded":h.overlayVisible,"aria-controls":v.panelId,onClick:s[9]||=function(){return v.onDropdownClick&&v.onDropdownClick.apply(v,arguments)}},i.ptm(`dropdown`)),[b(i.$slots,`dropdownicon`,{class:r(i.dropdownIcon)},function(){return[(o(),n(f(i.dropdownIcon?`span`:`ChevronDown`),_({class:i.dropdownIcon},i.ptm(`dropdownIcon`)),null,16,[`class`]))]})],16,Be)):t(``,!0)]}),i.typeahead?(o(),d(`span`,_({key:4,role:`status`,"aria-live":`polite`,class:`p-hidden-accessible`},i.ptm(`hiddenSearchResult`),{"data-p-hidden-accessible":!0}),m(v.searchResultMessageText),17)):t(``,!0),u(O,{appendTo:i.appendTo},{default:A(function(){return[u(ae,_({name:`p-anchored-overlay`,onEnter:v.onOverlayEnter,onAfterEnter:v.onOverlayAfterEnter,onLeave:v.onOverlayLeave,onAfterLeave:v.onOverlayAfterLeave},i.ptm(`transition`)),{default:A(function(){return[h.overlayVisible?(o(),d(`div`,_({key:0,ref:v.overlayRef,id:v.panelId,class:[i.cx(`overlay`),i.panelClass,i.overlayClass],style:Q(Q({},i.panelStyle),i.overlayStyle),onClick:s[10]||=function(){return v.onOverlayClick&&v.onOverlayClick.apply(v,arguments)},onKeydown:s[11]||=function(){return v.onOverlayKeyDown&&v.onOverlayKeyDown.apply(v,arguments)},"data-p":v.overlayDataP},i.ptm(`overlay`)),[b(i.$slots,`header`,{value:i.d_value,suggestions:v.visibleOptions}),g(`div`,_({class:i.cx(`listContainer`),style:{"max-height":v.virtualScrollerDisabled?i.scrollHeight:``}},i.ptm(`listContainer`)),[u(D,_({ref:v.virtualScrollerRef},i.virtualScrollerOptions,{style:{height:i.scrollHeight},items:v.visibleOptions,tabindex:-1,disabled:v.virtualScrollerDisabled,pt:i.ptm(`virtualScroller`)}),e({content:A(function(e){var n=e.styleClass,r=e.contentRef,s=e.items,l=e.getItemOptions,u=e.contentStyle,f=e.itemSize;return[g(`ul`,_({ref:function(e){return v.listRef(e,r)},id:i.$id+`_list`,class:[i.cx(`list`),n],style:u,role:`listbox`,"aria-label":v.listAriaLabel},i.ptm(`list`)),[(o(!0),d(L,null,a(s,function(e,t){return o(),d(L,{key:v.getOptionRenderKey(e,v.getOptionIndex(t,l))},[v.isOptionGroup(e)?(o(),d(`li`,_({key:0,id:i.$id+`_`+v.getOptionIndex(t,l),style:{height:f?f+`px`:void 0},class:i.cx(`optionGroup`),role:`option`},{ref_for:!0},i.ptm(`optionGroup`)),[b(i.$slots,`optiongroup`,{option:e.optionGroup,index:v.getOptionIndex(t,l)},function(){return[c(m(v.getOptionGroupLabel(e.optionGroup)),1)]})],16,Ue)):C((o(),d(`li`,_({key:1,id:i.$id+`_`+v.getOptionIndex(t,l),style:{height:f?f+`px`:void 0},class:i.cx(`option`,{option:e,i:t,getItemOptions:l}),role:`option`,"aria-label":v.getOptionLabel(e),"aria-selected":v.isSelected(e),"aria-disabled":v.isOptionDisabled(e),"aria-setsize":v.ariaSetSize,"aria-posinset":v.getAriaPosInset(v.getOptionIndex(t,l)),onClick:function(t){return v.onOptionSelect(t,e)},onMousemove:function(e){return v.onOptionMouseMove(e,v.getOptionIndex(t,l))},"data-p-selected":v.isSelected(e),"data-p-focused":h.focusedOptionIndex===v.getOptionIndex(t,l),"data-p-disabled":v.isOptionDisabled(e)},{ref_for:!0},v.getPTOptions(e,l,t,`option`)),[b(i.$slots,`option`,{option:e,index:v.getOptionIndex(t,l)},function(){return[c(m(v.getOptionLabel(e)),1)]})],16,We)),[[k]])],64)}),128)),i.showEmptyMessage&&(!s||s&&s.length===0)?(o(),d(`li`,_({key:0,class:i.cx(`emptyMessage`),role:`option`},i.ptm(`emptyMessage`)),[b(i.$slots,`empty`,{},function(){return[c(m(v.searchResultMessageText),1)]})],16)):t(``,!0)],16,He)]}),_:2},[i.$slots.loader?{name:`loader`,fn:A(function(e){var t=e.options;return[b(i.$slots,`loader`,{options:t})]}),key:`0`}:void 0]),1040,[`style`,`items`,`disabled`,`pt`])],16),b(i.$slots,`footer`,{value:i.d_value,suggestions:v.visibleOptions}),g(`span`,_({role:`status`,"aria-live":`polite`,class:`p-hidden-accessible`},i.ptm(`hiddenSelectedMessage`),{"data-p-hidden-accessible":!0}),m(v.selectedMessageText),17)],16,Ve)):t(``,!0)]}),_:3},16,[`onEnter`,`onAfterEnter`,`onLeave`,`onAfterLeave`])]}),_:3},8,[`appendTo`])],16,Fe)}Y.render=Ge;var Ke={class:`flex flex-col gap-1`},qe={key:0,class:`text-sm font-medium text-neutral-700`},Je={key:0,class:`text-red-500`},Ye={class:`text-sm`},Xe={class:`px-3 py-2 text-sm text-neutral-400`},Ze={key:1,class:`text-xs text-red-500`},$={__name:`AppAutocomplete`,props:{modelValue:{type:[Number,String],default:null},label:{type:String,default:``},options:{type:Array,required:!0},optionLabel:{type:String,default:`label`},optionValue:{type:String,default:`value`},searchFields:{type:Array,default:null},placeholder:{type:String,default:`Ketik untuk mencari...`},emptyMessage:{type:String,default:`Tidak ada hasil ditemukan`},error:{type:String,default:``},required:{type:Boolean,default:!1},disabled:{type:Boolean,default:!1}},emits:[`update:modelValue`],setup(e,{emit:n}){let r=e,a=n,l=M([]),f=I({get(){return r.options.find(e=>e[r.optionValue]===r.modelValue)||null},set(e){a(`update:modelValue`,e?e[r.optionValue]:null)}}),p=I(()=>r.searchFields?.length?r.searchFields:[r.optionLabel]);function h(e){let t=e.query.toLowerCase().trim();l.value=t?r.options.filter(e=>p.value.some(n=>String(e[n]??``).toLowerCase().includes(t))):r.options.slice(0,10)}return(n,r)=>(o(),d(`div`,Ke,[e.label?(o(),d(`label`,qe,[c(m(e.label)+` `,1),e.required?(o(),d(`span`,Je,`*`)):t(``,!0)])):t(``,!0),u(R(Y),{modelValue:f.value,"onUpdate:modelValue":r[0]||=e=>f.value=e,suggestions:l.value,"option-label":e.optionLabel,placeholder:e.placeholder,disabled:e.disabled,invalid:!!e.error,dropdown:``,class:`w-full`,"input-class":`w-full`,onComplete:h},{option:A(t=>[b(n.$slots,`option`,i(s(t)),()=>[g(`div`,null,[g(`p`,Ye,m(t.option[e.optionLabel]),1)])])]),empty:A(()=>[g(`div`,Xe,m(e.emptyMessage),1)]),_:3},8,[`modelValue`,`suggestions`,`option-label`,`placeholder`,`disabled`,`invalid`]),e.error?(o(),d(`span`,Ze,m(e.error),1)):t(``,!0)]))}},Qe={class:`print:hidden max-w-2xl`},$e={class:`card space-y-4`},et={class:`text-sm text-slate-500`},tt={class:`flex justify-end`},nt={key:0},rt={class:`flex justify-end gap-3`},it={key:0,class:`hidden print:block`},at={class:`mx-auto max-w-[480px] text-slate-900`},ot={class:`w-full border-collapse text-[13px]`},st={class:`py-0.5 align-top`},ct={class:`py-0.5 align-top`},lt={class:`py-0.5 align-top`},ut={class:`py-0.5 align-top`},dt={class:`py-0.5 align-top`},ft={__name:`BookLoanFormView`,setup(e){let n=de(),r=V(`books`),i=V(`citizens`),a=M(r??[]),s=M(i??[]),l=M(!r&&!i),f=M(!1),p=M(null),h=M(!1),_=D({citizen_id:null,book_id:null,borrowed_at:new Date().toISOString().slice(0,10),loanDurationDays:7}),y=I(()=>s.value.filter(e=>e.status===`Active`).map(e=>({label:e.full_name,value:e.citizen_id}))),b=I(()=>a.value.filter(e=>Number(e.stock)>0).map(e=>({label:`${e.title} (stok ${e.stock})`,value:e.book_id}))),x=I(()=>{let e=new Date(`${_.borrowed_at}T00:00:00`);return e.setDate(e.getDate()+Number(_.loanDurationDays||0)),e.toISOString().slice(0,10)});function S(e,t){return e.response?.data?.message??t}async function C({background:e=!1}={}){e||(l.value=!0);try{let[e,t]=await Promise.all([ye(),_e()]);a.value=e,s.value=t,B(`books`,e),B(`citizens`,t)}catch(e){n.add({severity:`error`,summary:`Gagal memuat data`,detail:S(e,`Coba lagi.`),life:3500})}finally{e||(l.value=!1)}}async function w(){if(!_.citizen_id||!_.book_id||!_.borrowed_at){n.add({severity:`warn`,summary:`Data belum lengkap`,detail:`Pilih anggota, buku, dan tanggal pinjam.`,life:3e3});return}let e=s.value.find(e=>e.citizen_id===_.citizen_id),t=a.value.find(e=>e.book_id===_.book_id);f.value=!0;try{let r=await ve({citizen_id:_.citizen_id,book_id:_.book_id,borrowed_at:_.borrowed_at,due_date:x.value});p.value={...r,full_name:e?.full_name??`-`,title:t?.title??`-`,borrowed_at:_.borrowed_at,due_date:x.value},n.add({severity:`success`,summary:`Peminjaman berhasil dicatat`,life:2500}),Object.assign(_,{citizen_id:null,book_id:null,borrowed_at:new Date().toISOString().slice(0,10),loanDurationDays:7}),h.value=!0,C({background:!0})}catch(e){n.add({severity:`error`,summary:`Peminjaman gagal dicatat`,detail:S(e,`Coba lagi.`),life:3500})}finally{f.value=!1}}function T(){window.print()}return v(()=>C({background:!!(r||i)})),(e,n)=>(o(),d(`div`,null,[g(`div`,Qe,[n[7]||=g(`h1`,{class:`m-0 mb-1 text-[22px] font-bold text-slate-900`},`Peminjaman Buku`,-1),n[8]||=g(`p`,{class:`mb-5 text-sm text-slate-500`},`Catat transaksi peminjaman buku perpustakaan desa.`,-1),g(`div`,$e,[u($,{modelValue:_.citizen_id,"onUpdate:modelValue":n[0]||=e=>_.citizen_id=e,options:y.value,label:`Anggota`,placeholder:`Pilih anggota`,disabled:l.value},null,8,[`modelValue`,`options`,`disabled`]),u($,{modelValue:_.book_id,"onUpdate:modelValue":n[1]||=e=>_.book_id=e,options:b.value,label:`Buku`,placeholder:`Pilih buku`,disabled:l.value},null,8,[`modelValue`,`options`,`disabled`]),u(H,{modelValue:_.borrowed_at,"onUpdate:modelValue":n[2]||=e=>_.borrowed_at=e,type:`date`,label:`Tanggal Pinjam`},null,8,[`modelValue`]),u(H,{modelValue:_.loanDurationDays,"onUpdate:modelValue":n[3]||=e=>_.loanDurationDays=e,modelModifiers:{number:!0},type:`number`,min:`1`,label:`Lama Pinjam (hari)`},null,8,[`modelValue`]),g(`p`,et,[n[6]||=c(`Jatuh tempo: `,-1),g(`strong`,null,m(x.value),1)]),g(`div`,tt,[u(U,{label:`Simpan Peminjaman`,variant:`primary`,loading:f.value,onClick:w},null,8,[`loading`])])])]),u(R(pe),{visible:h.value,"onUpdate:visible":n[5]||=e=>h.value=e,modal:``,header:`Bukti Peminjaman Buku`,style:{width:`32rem`}},{default:A(()=>[p.value?(o(),d(`div`,nt,[g(`p`,null,`No. Peminjaman: `+m(p.value.loan_id),1),g(`p`,null,`Anggota: `+m(p.value.full_name),1),g(`p`,null,`Buku: `+m(p.value.title),1),g(`p`,null,`Tanggal Pinjam: `+m(p.value.borrowed_at),1),g(`p`,null,`Jatuh Tempo: `+m(p.value.due_date),1),g(`div`,rt,[u(U,{label:`Tutup`,variant:`outline`,onClick:n[4]||=e=>h.value=!1}),u(U,{label:`Cetak Bukti`,icon:`pi pi-print`,variant:`primary`,onClick:T})])])):t(``,!0)]),_:1},8,[`visible`]),p.value?(o(),d(`div`,it,[g(`div`,at,[n[19]||=ee(`<div class="mb-5 text-center"><p class="m-0 text-base font-bold uppercase tracking-wide">Perpustakaan Kalurahan Bimomartani</p><p class="mt-0.5 text-[11px] text-slate-600">Kalurahan Bimomartani, Kec. Ngemplak, Kab. Sleman, Daerah Istimewa Yogyakarta</p><div class="mt-2 border-b-2 border-slate-900"></div></div><h2 class="mb-5 text-center text-[15px] font-bold uppercase underline">Bukti Peminjaman Buku</h2>`,2),g(`table`,ot,[g(`tbody`,null,[g(`tr`,null,[n[9]||=g(`td`,{class:`w-[140px] py-0.5 align-top`},`No. Peminjaman`,-1),n[10]||=g(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),g(`td`,st,m(p.value.loan_id),1)]),g(`tr`,null,[n[11]||=g(`td`,{class:`w-[140px] py-0.5 align-top`},`Nama Anggota`,-1),n[12]||=g(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),g(`td`,ct,m(p.value.full_name),1)]),g(`tr`,null,[n[13]||=g(`td`,{class:`w-[140px] py-0.5 align-top`},`Judul Buku`,-1),n[14]||=g(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),g(`td`,lt,m(p.value.title),1)]),g(`tr`,null,[n[15]||=g(`td`,{class:`w-[140px] py-0.5 align-top`},`Tanggal Pinjam`,-1),n[16]||=g(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),g(`td`,ut,m(p.value.borrowed_at),1)]),g(`tr`,null,[n[17]||=g(`td`,{class:`w-[140px] py-0.5 align-top`},`Jatuh Tempo`,-1),n[18]||=g(`td`,{class:`w-3 py-0.5 align-top`},`:`,-1),g(`td`,dt,m(p.value.due_date),1)])])]),n[20]||=g(`div`,{class:`mt-10 pr-6 text-right text-[13px]`},[g(`p`,null,`Petugas Perpustakaan`),g(`p`,{class:`mt-16`},`( ...................... )`)],-1)])])):t(``,!0)]))}};export{ft as default};