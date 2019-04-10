<div class="mobile-selectors-container">
    <select data-width="200" class="mobile-device-selector preview-device-selector select2" data-target="mobile" data-has-search="false">
        {{#each items}}
        <option value="{{dataValue}}" data-value="{{dataValue}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
        {{/each}}
    </select>
    <select tabindex="-1" class="mobile-orientation-selector orientation-selector select2"
            data-target="mobile"
            data-has-search="false">
        <option value="landscape">{{__ 'Landscape'}}</option>
        <option value="portrait">{{__ 'Portrait'}}</option>
    </select>
</div>
