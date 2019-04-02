/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 Open Assessment Technologies SA;
 */
/**
 * Helper to work with screen values and mobile devices list
 * for "select device" select-box  on any test-item preview  page
 * for example using scale plugin app/taoQtiTestPreviewer/views/js/previewer/plugins/tools/scale/scale.js
 *
 * @author Pavel Hendelman <pavel@taotesting.com>
 */
define([
    'json!taoItems/preview/resources/device-list.json'
], function (
    deviceList
) {
    'use strict';
    /**
     * Create data set for device selectors
     *
     * @param type
     * @returns {Array}
     * @private
     */
    function getDeviceSelectorData(type){
        /*
         * @todo
         * The device list is currently based on the devices found on the Chrome emulator.
         * This is not ideal and should be changed in the future.
         * I have http://en.wikipedia.org/wiki/List_of_displays_by_pixel_density in mind but we
         * will need to figure what criteria to apply when generating the list.
         */
        var devices = type === 'mobile' ? deviceList.tablets : deviceList.screens,
            options = [];

        _.forEach(devices, function (value) {

            options.push({
                value: value.label,
                label: value.label,
                dataValue: [value.width, value.height].join(',')
            });
        });

        return options;
    }

    return {
        mobileDevices: getDeviceSelectorData('mobile'),
        desktopDevices: getDeviceSelectorData('desktop'),
        byType:getDeviceSelectorData
    };
});
