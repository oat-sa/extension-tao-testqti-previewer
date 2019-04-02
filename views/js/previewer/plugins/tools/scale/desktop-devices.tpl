<select class="desktop-device-selector preview-device-selector" data-target="desktop">
    {{#each items}}
    <option value="{{value}}" data-value="{{dataValue}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
    {{/each}}
</select>