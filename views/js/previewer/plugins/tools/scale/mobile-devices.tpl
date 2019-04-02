<select class="mobile-device-selector preview-device-selector" data-target="mobile">
    {{#each items}}
    <option value="{{value}}" data-value="{{dataValue}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
    {{/each}}
</select>
<select tabindex="-1" class="mobile-orientation-selector orientation-selector"
        data-target="mobile">
    <option value="landscape">{{__ 'Landscape'}}</option>
    <option value="portrait">{{__ 'Portrait'}}</option>
</select>