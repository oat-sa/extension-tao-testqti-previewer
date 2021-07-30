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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */
define([
    'module',
    'context',
    'lodash',
    'core/moduleLoader'
], function (module, context, _, moduleLoader) {
    'use strict';

    const moduleConfig = module.config();
    let handlers = [];
    if (moduleConfig.handlers) {
        /*
         * This loads all the modules from module configuration, which are in the `handlers` array.
         */
        moduleLoader({}, _.isFunction)
            .addList(moduleConfig.handlers)
            .load(context.bundle)
            .then(data => (handlers = data));
    }

    return function itemDataHandlers(itemData) {
        if (!handlers.length) {
            return Promise.resolve(itemData);
        } if (handlers.length === 1) {
            return handlers[0](itemData);
        } else {
            return handlers.reduce(function(prev, cur) {
                return prev.then(updateItemData => cur(updateItemData)).catch(cur().reject);
            }, handlers[0](itemData));
        }
    };
});
