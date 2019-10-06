import { BrowserModule } from '@angular/platform-browser';
import { SocketIoModule } from 'ngx-socket-io';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { StoreModule } from '@ngrx/store';

import { AppComponent } from './app.component';
import { HomepageComponent } from './homepage/homepage.component';

import {url} from './iobroker.service';
import { MyCounterComponent } from './my-counter/my-counter.component';
import { counterReducer } from './counter.reducer';
import { config } from './iobroker.service';

@NgModule({
  declarations: [
    AppComponent,
    HomepageComponent,
    MyCounterComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    SocketIoModule.forRoot(config),
    StoreModule.forRoot({ count: counterReducer })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
