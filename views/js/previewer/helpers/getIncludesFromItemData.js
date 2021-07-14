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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA;
 */

define(['lodash'], function (_) {
    'use strict';

    function getIncludesFromElement(element) {
        let includes = {};
        _.forEach(['elements', 'choices'], elementCollection => {
            for (let serial in element[elementCollection]) {
                const childElement = element[elementCollection][serial];
                if (childElement.qtiClass === 'include') {
                    includes[serial] = childElement;
                } else {
                    includes = _.extend(includes, getIncludesFromElement(childElement));
                }
            }
        });
        if (element.body) {
            includes = _.extend(includes, getIncludesFromElement(element.body));
        }
        if (element.prompt) {
            includes = _.extend(includes, getIncludesFromElement(element.prompt));
        }
        return includes;
    }
    /**
     * Get all passage elements qtiClass: 'include' presents in item
     * @param {Object} itemData
     * @returns {Array} array of include elements
     */
    return function getIncludesFromItemData(itemData) {
        let includes = {};
        if (itemData.content && itemData.content.data && itemData.content.data.body) {
            includes = _.extend(includes, getIncludesFromElement(itemData.content.data.body));
        }
        return includes;
    };
});
